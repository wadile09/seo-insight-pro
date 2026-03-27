import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import pLimit from "p-limit";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: SEO Analysis
  app.post("/api/analyze-site", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const inputUrl = url.trim();
      const isXml = inputUrl.toLowerCase().endsWith(".xml");
      const baseUrl = new URL(inputUrl).origin;
      const visited = new Set<string>();
      const results: any[] = [];
      const queue: string[] = [];
      const limit = pLimit(15); // Higher concurrency for "all" URLs
      const maxPages = 500; // Increased limit to handle "all" URLs for most sites

      // Helper to clean URLs
      const cleanUrl = (href: string) => {
        try {
          const absolute = new URL(href, baseUrl).href.split('#')[0];
          return absolute.endsWith('/') ? absolute.slice(0, -1) : absolute;
        } catch {
          return null;
        }
      };

      let foundSitemap = false;

      if (isXml) {
        // Direct sitemap input
        try {
          const sitemapRes = await axios.get(inputUrl, { timeout: 10000 });
          const $ = cheerio.load(sitemapRes.data, { xmlMode: true });
          const urlsFromSitemap: string[] = [];
          $("loc").each((i, el) => {
            const loc = $(el).text().trim();
            if (loc) urlsFromSitemap.push(loc);
          });
          if (urlsFromSitemap.length > 0) {
            queue.push(...urlsFromSitemap);
            foundSitemap = true;
          }
        } catch (e) {
          console.error("Failed to parse direct XML:", e.message);
        }
      } else {
        // 1. Try to find and parse sitemap.xml automatically
        const sitemapUrls = [
          `${baseUrl}/sitemap.xml`,
          `${baseUrl}/sitemap_index.xml`,
          `${baseUrl}/sitemap-index.xml`,
          `${baseUrl}/wp-sitemap.xml` // Common for WordPress
        ];

        for (const sitemapUrl of sitemapUrls) {
          try {
            const sitemapRes = await axios.get(sitemapUrl, { timeout: 5000 });
            if (sitemapRes.status === 200 && sitemapRes.data) {
              const $ = cheerio.load(sitemapRes.data, { xmlMode: true });
              const urlsFromSitemap: string[] = [];
              
              $("loc").each((i, el) => {
                const loc = $(el).text().trim();
                if (loc) urlsFromSitemap.push(loc);
              });

              if (urlsFromSitemap.length > 0) {
                queue.push(...urlsFromSitemap);
                foundSitemap = true;
                break;
              }
            }
          } catch (e) {}
        }
      }

      // If no sitemap found or direct XML failed, start with the provided URL
      if (!foundSitemap) {
        queue.push(inputUrl);
      }

      // Ensure we don't crawl the same URL twice
      const initialUrl = cleanUrl(inputUrl) || inputUrl;
      visited.add(initialUrl);

      while (queue.length > 0 && results.length < maxPages) {
        const batchSize = Math.min(queue.length, 15);
        const currentBatch = queue.splice(0, batchSize);

        const tasks = currentBatch.map((currentUrl) => 
          limit(async () => {
            if (results.length >= maxPages) return;
            
            const normalized = cleanUrl(currentUrl);
            if (!normalized || (visited.has(normalized) && currentUrl !== inputUrl)) return;
            visited.add(normalized);

            const isSubSitemap = currentUrl.toLowerCase().endsWith(".xml");

            try {
              const response = await axios.get(currentUrl, {
                timeout: 10000,
                headers: { 
                  'User-Agent': 'SEO-Insight-Bot/1.0',
                  'Accept': isSubSitemap ? 'application/xml,text/xml,*/*' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
              });
              
              const data = response.data;
              if (!data) return;

              if (isSubSitemap) {
                // It's a sitemap or sitemap index
                const $ = cheerio.load(data, { xmlMode: true });
                const subUrls: string[] = [];
                $("loc").each((i, el) => {
                  const loc = $(el).text().trim();
                  if (loc) subUrls.push(loc);
                });
                // Add discovered URLs back to the queue
                queue.push(...subUrls);
                console.log(`Extracted ${subUrls.length} URLs from sub-sitemap: ${currentUrl}`);
                return;
              }

              // It's a regular HTML page
              if (typeof data !== 'string') return;
              const $ = cheerio.load(data);

              const metadata = {
                url: currentUrl,
                title: $("title").text().trim() || "No title",
                description: $('meta[name="description"]').attr("content")?.trim() || "No description",
                h1: $("h1").map((i, el) => $(el).text().trim()).get().filter(t => t.length > 0),
                h2: $("h2").map((i, el) => $(el).text().trim()).get().filter(t => t.length > 0),
                images: $("img").map((i, el) => ({
                  src: $(el).attr("src"),
                  alt: $(el).attr("alt")?.trim() || "No alt text"
                })).get().filter(img => img.src),
                linksCount: $("a").length,
                canonical: $('link[rel="canonical"]').attr("href") || "No canonical tag",
                robots: $('meta[name="robots"]').attr("content") || "No robots tag"
              };

              results.push(metadata);

              // Only crawl links if we didn't start from a sitemap
              if (!foundSitemap && results.length < maxPages) {
                $("a").each((i, el) => {
                  const href = $(el).attr("href");
                  if (href) {
                    const absoluteUrl = cleanUrl(href);
                    if (absoluteUrl && absoluteUrl.startsWith(baseUrl) && !visited.has(absoluteUrl)) {
                      queue.push(absoluteUrl);
                    }
                  }
                });
              }
            } catch (err: any) {
              console.error(`Failed to fetch ${currentUrl}:`, err.message);
            }
          })
        );

        await Promise.all(tasks);
      }

      res.json({ results });
    } catch (err) {
      console.error("Crawl error:", err);
      res.status(500).json({ error: "Invalid URL or server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
