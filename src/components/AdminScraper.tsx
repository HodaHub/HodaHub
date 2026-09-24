import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  Server,
  CloudLightning,
  Database,
  Image,
  ExternalLink,
  ChevronRight,
  ListPlus,
  Terminal,
  RefreshCw,
  Search,
  Check,
} from 'lucide-react';
import { useProductsStore } from '../store/useProductsStore';

// Configurable Scraper Backend API base URL
const SCRAPER_API_BASE = 'http://localhost:5000/api';

export interface ScraperJob {
  id: string;
  target: string;
  status: 'PENDING' | 'CRAWLING' | 'SCRAPING' | 'COMPLETED' | 'FAILED';
  discoveredCount: number;
  syncedCount: number;
  skippedCount: number;
  errorCount: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

interface ServerStatus {
  online: boolean;
  sqliteSyncedCount?: number;
  supabaseConnected?: boolean;
  activeJobsCount?: number;
  timestamp?: string;
}

interface AdminScraperProps {
  onNavigateToProducts?: () => void;
}

export const AdminScraper: React.FC<AdminScraperProps> = ({ onNavigateToProducts }) => {
  const [mode, setMode] = useState<'site' | 'urls'>('site');
  const [siteUrl, setSiteUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [maxProducts, setMaxProducts] = useState<number>(50);

  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>({ online: false });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState<ScraperJob | null>(null);
  const [jobHistory, setJobHistory] = useState<ScraperJob[]>([]);
  const [catalogRefreshed, setCatalogRefreshed] = useState(false);

  const pollIntervalRef = useRef<any>(null);

  // 1. Health check & Initial History
  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch(`${SCRAPER_API_BASE}/status`, { signal: AbortSignal.timeout(3500) });
      if (!res.ok) throw new Error('Bad response');
      const data = await res.json();
      setServerStatus({
        online: true,
        sqliteSyncedCount: data.sqliteSyncedCount ?? 0,
        supabaseConnected: data.supabaseConnected ?? false,
        activeJobsCount: data.activeJobsCount ?? 0,
        timestamp: data.timestamp,
      });
      fetchJobsHistory();
    } catch {
      setServerStatus({ online: false });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const fetchJobsHistory = async () => {
    try {
      const res = await fetch(`${SCRAPER_API_BASE}/jobs`, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setJobHistory(data);
          // Auto-resume tracking if there's an ongoing job
          const ongoing = data.find((j: ScraperJob) => j.status === 'CRAWLING' || j.status === 'SCRAPING');
          if (ongoing && !activeJobId) {
            setActiveJobId(ongoing.id);
            setCurrentJob(ongoing);
            setLoading(true);
          }
        }
      }
    } catch {
      // silently fail if offline
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 12000);
    return () => clearInterval(interval);
  }, []);

  // 2. Poll Active Job
  useEffect(() => {
    if (!activeJobId) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    const pollJob = async () => {
      try {
        const res = await fetch(`${SCRAPER_API_BASE}/jobs/${activeJobId}`);
        if (!res.ok) return;
        const job: ScraperJob = await res.json();
        setCurrentJob(job);

        if (job.status === 'COMPLETED' || job.status === 'FAILED') {
          setActiveJobId(null);
          setLoading(false);
          // Refresh products store so synced items immediately appear in storefront!
          if (job.status === 'COMPLETED' && job.syncedCount > 0) {
            useProductsStore.getState().fetchProducts({ force: true });
            setCatalogRefreshed(true);
            setTimeout(() => setCatalogRefreshed(false), 8000);
          }
          fetchJobsHistory();
        }
      } catch (err) {
        console.error('Job polling error:', err);
      }
    };

    pollJob();
    pollIntervalRef.current = setInterval(pollJob, 3000);
    return () => clearInterval(pollIntervalRef.current);
  }, [activeJobId]);

  // 3. Handle Full Site Scrape Start
  const handleStartSiteScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = siteUrl.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    setLoading(true);
    setCurrentJob(null);

    try {
      const res = await fetch(`${SCRAPER_API_BASE}/scrape-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: url, maxProducts: Number(maxProducts) || 50 }),
      });

      const data = await res.json();
      if (data.success && data.jobId) {
        setActiveJobId(data.jobId);
        setCurrentJob({
          id: data.jobId,
          target: url,
          status: 'CRAWLING',
          discoveredCount: 0,
          syncedCount: 0,
          skippedCount: 0,
          errorCount: 0,
          startedAt: new Date().toISOString(),
        });
      } else {
        alert(data.error || 'Failed to start crawler');
        setLoading(false);
      }
    } catch {
      alert('Cannot connect to Scraper Server. Make sure "npm run server" is running on port 5000!');
      setLoading(false);
    }
  };

  // 4. Handle Batch URLs Scrape Start
  const handleStartBatchUrlsScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    const urls = batchUrls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 5 && (u.startsWith('http://') || u.startsWith('https://')));

    if (urls.length === 0) {
      alert('Please enter at least 1 valid product URL (starting with http:// or https://)');
      return;
    }

    setLoading(true);
    setCurrentJob(null);

    try {
      const res = await fetch(`${SCRAPER_API_BASE}/scrape-urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      const data = await res.json();
      if (data.success && data.jobId) {
        setActiveJobId(data.jobId);
        setCurrentJob({
          id: data.jobId,
          target: `${urls.length} manual URLs`,
          status: 'SCRAPING',
          discoveredCount: urls.length,
          syncedCount: 0,
          skippedCount: 0,
          errorCount: 0,
          startedAt: new Date().toISOString(),
        });
      } else {
        alert(data.error || 'Failed to start batch scraping');
        setLoading(false);
      }
    } catch {
      alert('Cannot connect to Scraper Server. Make sure "npm run server" is running on port 5000!');
      setLoading(false);
    }
  };

  const handleManualCatalogRefresh = async () => {
    setLoading(true);
    await useProductsStore.getState().fetchProducts({ force: true });
    setCatalogRefreshed(true);
    setLoading(false);
    setTimeout(() => setCatalogRefreshed(false), 5000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header Banner & Status */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Automated Product Scraper & Pipeline
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                  Supabase + Cloudinary
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Automatically scrape products, download images to your Cloudinary media library, apply 20% markup, and sync directly into HodaHub's live Supabase catalog.
              </p>
            </div>
          </div>

          {/* Server Connection Badge */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                serverStatus.online
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  serverStatus.online ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
                }`}
              />
              <span>{serverStatus.online ? 'Server Running (Port 5000)' : 'Server Offline'}</span>
            </div>

            <button
              onClick={checkHealth}
              disabled={isCheckingHealth}
              title="Refresh Server Connection"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${isCheckingHealth ? 'animate-spin text-primary-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Pipeline Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <Database className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Database</p>
              <p className="text-xs font-bold text-slate-800">Supabase (products)</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <Image className="w-4 h-4 text-sky-600" />
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Image Storage</p>
              <p className="text-xs font-bold text-slate-800">Cloudinary (hodahub)</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <Layers className="w-4 h-4 text-amber-600" />
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Deduplication</p>
              <p className="text-xs font-bold text-slate-800">
                {serverStatus.sqliteSyncedCount ? `${serverStatus.sqliteSyncedCount} Synced` : 'SQLite Tracked'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <CloudLightning className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Markup Rule</p>
              <p className="text-xs font-bold text-slate-800">+20% Automated</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Offline Helper Alert if Server Not Running */}
      {!serverStatus.online && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h3 className="font-bold text-sm text-amber-900">Background Automation Server Is Offline</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Playwright browser scraping and Cloudinary image uploading run through your local automation service. Start it once in your terminal to begin syncing products:
              </p>
              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-xs flex items-center justify-between gap-4 select-all shadow-inner">
                <span>cd "c:\Users\ANAND RAO\Downloads\automation scrapping" ; npm run server</span>
                <button
                  onClick={() => navigator.clipboard.writeText('cd "c:\\Users\\ANAND RAO\\Downloads\\automation scrapping" ; npm run server')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-sans font-medium transition-colors"
                >
                  Copy Command
                </button>
              </div>
              <p className="text-[11px] text-amber-700">
                Once started, click the <strong>Refresh Connection</strong> button at top right.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Catalog Refreshed Notification Banner */}
      {catalogRefreshed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">
              Storefront catalog successfully refreshed! Newly scraped products are live on the website.
            </span>
          </div>
          {onNavigateToProducts && (
            <button
              onClick={onNavigateToProducts}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0"
            >
              View In Products Tab &rarr;
            </button>
          )}
        </div>
      )}

      {/* 4. Scraper Control Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setMode('site')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'site'
                ? 'bg-white text-primary-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Full Website Auto-Discovery</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('urls')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'urls'
                ? 'bg-white text-primary-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <ListPlus className="w-4 h-4" />
            <span>Direct Product URLs (Batch)</span>
          </button>
        </div>

        <div className="p-6">
          {mode === 'site' ? (
            <form onSubmit={handleStartSiteScrape} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Target Website URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="e.g. https://www.urbanoutfitters.com or brandstore.com"
                    disabled={loading || !serverStatus.online}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:opacity-50 disabled:bg-slate-100"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Enter the homepage or catalog URL. The crawler will automatically discover product pages, extract descriptions, prices, specifications, and upload all gallery images.
                </p>
              </div>

              {/* Max Products & Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Max Products Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={maxProducts}
                    onChange={(e) => setMaxProducts(Number(e.target.value))}
                    disabled={loading || !serverStatus.online}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Quick Preset Limit
                  </label>
                  <div className="flex gap-2">
                    {[15, 30, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMaxProducts(preset)}
                        disabled={loading || !serverStatus.online}
                        className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                          maxProducts === preset
                            ? 'bg-primary-50 border-primary-500 text-primary-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div className="text-xs text-slate-500 flex items-center gap-1.5 self-start sm:self-center">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Images uploaded directly to Cloudinary preset <strong>hodahub_preset</strong></span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !serverStatus.online}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                    loading || !serverStatus.online
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                      : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 active:scale-98 shadow-primary-500/25'
                  }`}
                >
                  {loading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Crawler In Progress...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Scraping & Sync to Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStartBatchUrlsScrape} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Direct Product URLs (One URL per line)
                </label>
                <textarea
                  rows={5}
                  value={batchUrls}
                  onChange={(e) => setBatchUrls(e.target.value)}
                  placeholder="https://brandstore.com/products/leather-jacket&#10;https://brandstore.com/products/canvas-sneakers&#10;https://brandstore.com/products/denim-shirt"
                  disabled={loading || !serverStatus.online}
                  required
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:opacity-50 disabled:bg-slate-100"
                />
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                  <span>Past specific product links you want to import into HodaHub.</span>
                  <span className="font-semibold text-slate-700">
                    {
                      batchUrls
                        .split('\n')
                        .map((u) => u.trim())
                        .filter((u) => u.startsWith('http')).length
                    }{' '}
                    URLs detected
                  </span>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleManualCatalogRefresh}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Store Catalog</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || !serverStatus.online}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                    loading || !serverStatus.online
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                      : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 active:scale-98 shadow-primary-500/25'
                  }`}
                >
                  {loading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Syncing Batch URLs...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Scrape & Sync Batch URLs</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 5. Live Progress / Active Job Card */}
      {currentJob && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {currentJob.id}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    currentJob.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : currentJob.status === 'FAILED'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-primary-500/20 text-primary-300 border border-primary-500/30 animate-pulse'
                  }`}
                >
                  {currentJob.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-mono truncate max-w-xl">
                Target: <span className="text-white font-medium">{currentJob.target}</span>
              </p>
            </div>

            {currentJob.status === 'COMPLETED' && (
              <button
                onClick={handleManualCatalogRefresh}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-center"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Website Storefront</span>
              </button>
            )}
          </div>

          {/* Metric Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
              <span className="text-slate-400 text-xs font-medium block">Discovered</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {currentJob.discoveredCount}
              </span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
              <span className="text-emerald-400 text-xs font-medium block">Synced to Supabase</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                {currentJob.syncedCount}
              </span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
              <span className="text-amber-400 text-xs font-medium block">Skipped (Duplicates)</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">
                {currentJob.skippedCount}
              </span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
              <span className="text-rose-400 text-xs font-medium block">Errors</span>
              <span className="text-2xl font-black text-rose-400 mt-1 block">
                {currentJob.errorCount}
              </span>
            </div>
          </div>

          {/* Progress Indicator */}
          {(currentJob.status === 'CRAWLING' || currentJob.status === 'SCRAPING') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-primary-400" />
                  <span>
                    {currentJob.status === 'CRAWLING'
                      ? 'Discovering product pages and links...'
                      : 'Extracting product metadata, uploading images to Cloudinary, and inserting into Supabase...'}
                  </span>
                </span>
                <span className="font-mono text-primary-400">Live</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-primary-500 to-indigo-500 h-2 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {currentJob.error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-mono">
              Error: {currentJob.error}
            </div>
          )}
        </div>
      )}

      {/* 6. Recent Scraping Jobs History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900">Recent Syncing Operations</h3>
          </div>
          <button
            onClick={fetchJobsHistory}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            <RotateCw className="w-3 h-3" />
            <span>Refresh History</span>
          </button>
        </div>

        {jobHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No previous scraping jobs recorded. Start a new job above to sync products!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Discovered</th>
                  <th className="py-3 px-4 text-right text-emerald-600">Synced</th>
                  <th className="py-3 px-4 text-right text-amber-600">Skipped</th>
                  <th className="py-3 px-4 text-right text-slate-400">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobHistory.slice(0, 10).map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{job.id}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium max-w-xs truncate" title={job.target}>
                      {job.target}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : job.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-primary-50 text-primary-700 border border-primary-200 animate-pulse'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-700">{job.discoveredCount}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{job.syncedCount}</td>
                    <td className="py-3 px-4 text-right font-medium text-amber-600">{job.skippedCount}</td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono">
                      {new Date(job.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminScraper;
