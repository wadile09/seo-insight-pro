import React, { useState } from 'react';
import { Search, Globe, AlertCircle, CheckCircle2, ArrowRight, BarChart3, Layout, Image as ImageIcon, Link as LinkIcon, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageMetadata, getSEOAnalysis } from './services/geminiService';

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<PageMetadata[] | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedPage, setExpandedPage] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Failed to crawl website');

      const data = await response.json();
      setResults(data.results);

      setAnalyzing(true);
      const aiAnalysis = await getSEOAnalysis(data.results);
      console.log("test", aiAnalysis);
      setAnalysis(aiAnalysis);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 p-1.5 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">SEO Insight Pro</h1>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-500">
            <a href="#" className="hover:text-zinc-900 transition-colors">Dashboard</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">History</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Settings</a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-zinc-900 mb-4 tracking-tight"
          >
            Optimize Your Web Presence
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-600 max-w-2xl mx-auto"
          >
            Enter your website URL to get a deep crawl, metadata analysis, and AI-powered suggestions to boost your search rankings.
          </motion.p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleAnalyze} className="relative max-w-3xl mx-auto mb-16">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Globe className="w-5 h-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
            </div>
            <input
              type="url"
              placeholder="https://example.com"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full h-16 pl-12 pr-32 bg-white border-2 border-zinc-200 rounded-2xl focus:border-zinc-900 focus:ring-0 transition-all text-lg font-medium outline-none shadow-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 px-6 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 disabled:bg-zinc-400 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Crawling...' : 'Analyze'}
            </button>
          </div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </form>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-20 h-20 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-zinc-200 border-t-zinc-900 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe className="w-8 h-8 text-zinc-900" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">
              {analyzing ? 'AI Analysis in Progress...' : 'Scanning Sitemap & Analyzing All Pages...'}
            </h3>
            <p className="text-zinc-500">We're extracting all URLs from your sitemap (up to 500 pages) for a complete audit.</p>
          </div>
        )}

        {/* Results Section */}
        {analysis && results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Overall Score Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Overall SEO Health</h3>
                    <p className="text-3xl font-bold text-zinc-900">Analysis Summary</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`text-5xl font-black ${analysis.overallScore > 80 ? 'text-emerald-500' : analysis.overallScore > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {analysis.overallScore}%
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-1">SEO SCORE</span>
                  </div>
                </div>
                <p className="text-zinc-600 leading-relaxed italic border-l-4 border-zinc-900 pl-4 py-1">
                  "{analysis.summary}"
                </p>
              </div>

              <div className="bg-zinc-900 p-8 rounded-3xl text-white shadow-xl">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Key Stats</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Pages Crawled</span>
                    <span className="text-xl font-bold">{results.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Avg. Score</span>
                    <span className="text-xl font-bold">{Math.round(analysis.pageAnalyses.reduce((acc: number, p: any) => acc + p.score, 0) / results.length)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Total Issues</span>
                    <span className="text-xl font-bold text-amber-400">{analysis.pageAnalyses.reduce((acc: number, p: any) => acc + p.issues.length, 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* General Suggestions */}
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
              <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                AI Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.generalSuggestions.map((suggestion: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-zinc-700 font-medium">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Page Details */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-zinc-900 px-2">Page Breakdown</h3>
              {results.map((page, idx) => {
                const pageAnalysis = analysis.pageAnalyses.find((p: any) => p.url === page.url);
                const isExpanded = expandedPage === page.url;

                return (
                  <div key={idx} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpandedPage(isExpanded ? null : page.url)}
                      className="w-full p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${pageAnalysis?.score > 80 ? 'bg-emerald-50 text-emerald-600' :
                            pageAnalysis?.score > 50 ? 'bg-amber-50 text-amber-600' :
                              'bg-red-50 text-red-600'
                          }`}>
                          {pageAnalysis?.score}%
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-zinc-900 truncate">{page.title}</h4>
                          <p className="text-xs text-zinc-500 truncate font-mono">{page.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {pageAnalysis?.issues.length > 0 && (
                          <span className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {pageAnalysis.issues.length} Issues
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="border-t border-zinc-100 overflow-hidden"
                        >
                          <div className="p-6 space-y-8">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Meta Description</label>
                                  <p className="text-sm text-zinc-700 leading-relaxed">{page.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Canonical</label>
                                    <p className="text-xs font-mono text-zinc-500 truncate">{page.canonical}</p>
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Robots</label>
                                    <p className="text-xs font-mono text-zinc-500">{page.robots}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-zinc-50 p-4 rounded-xl space-y-3">
                                <h5 className="text-xs font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                  Identified Issues
                                </h5>
                                <ul className="space-y-2">
                                  {pageAnalysis?.issues.map((issue: string, i: number) => (
                                    <li key={i} className="text-sm text-zinc-600 flex items-start gap-2">
                                      <span className="text-amber-500 mt-1">•</span>
                                      {issue}
                                    </li>
                                  ))}
                                  {pageAnalysis?.issues.length === 0 && (
                                    <li className="text-sm text-emerald-600 font-medium">No issues found for this page!</li>
                                  )}
                                </ul>
                              </div>
                            </div>

                            {/* Content Structure */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-3">
                                <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                  <Layout className="w-3.5 h-3.5" />
                                  Headings (H1/H2)
                                </h5>
                                <div className="space-y-2">
                                  {page.h1.map((h, i) => (
                                    <div key={i} className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-1 rounded border-l-2 border-zinc-900">H1: {h}</div>
                                  ))}
                                  {page.h2.slice(0, 3).map((h, i) => (
                                    <div key={i} className="text-xs text-zinc-600 bg-zinc-50 px-2 py-1 rounded border-l-2 border-zinc-300">H2: {h}</div>
                                  ))}
                                  {page.h2.length > 3 && <p className="text-[10px] text-zinc-400">+{page.h2.length - 3} more headings</p>}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  Images ({page.images.length})
                                </h5>
                                <div className="space-y-2">
                                  {page.images.slice(0, 3).map((img, i) => (
                                    <div key={i} className="flex items-center gap-2 min-w-0">
                                      <div className="w-8 h-8 bg-zinc-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        <img src={img.src} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      </div>
                                      <p className="text-[10px] text-zinc-500 truncate italic">Alt: {img.alt}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                  <LinkIcon className="w-3.5 h-3.5" />
                                  Internal Links
                                </h5>
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl font-bold text-zinc-900">{page.linksCount}</span>
                                  <span className="text-xs text-zinc-500">Total links found</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !results && !error && (
          <div className="text-center py-20 border-2 border-dashed border-zinc-200 rounded-3xl">
            <Globe className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
            <p className="text-zinc-400 font-medium">Enter a URL above to start your SEO audit</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-zinc-200 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <BarChart3 className="w-5 h-5" />
            <span className="font-bold">SEO Insight Pro</span>
          </div>
          <p className="text-sm text-zinc-400">© 2026 SEO Insight Pro. Powered by Gemini AI.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors"><Globe className="w-5 h-5" /></a>
            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors"><Layout className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
