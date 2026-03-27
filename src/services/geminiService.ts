import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface PageMetadata {
  url: string;
  title: string;
  description: string;
  h1: string[];
  h2: string[];
  images: { src: string; alt: string }[];
  linksCount: number;
  canonical: string;
  robots: string;
}

export async function getSEOAnalysis(data: PageMetadata[]) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Analyze the following SEO data for a website and provide a comprehensive report.
    For each page, identify issues (missing titles, descriptions, missing H1s, missing alt tags, etc.).
    Provide general suggestions for the whole site to improve its SEO ranking.
    
    Data:
    ${JSON.stringify(data, null, 2)}
    
    Return the response in JSON format with the following structure:
    {
      "overallScore": number (0-100),
      "summary": "string",
      "pageAnalyses": [
        {
          "url": "string",
          "issues": ["string"],
          "score": number
        }
      ],
      "generalSuggestions": ["string"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            pageAnalyses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  url: { type: Type.STRING },
                  issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                  score: { type: Type.NUMBER }
                },
                required: ["url", "issues", "score"]
              }
            },
            generalSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["overallScore", "summary", "pageAnalyses", "generalSuggestions"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
}
