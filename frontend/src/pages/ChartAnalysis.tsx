import React, { useState, useEffect } from 'react'
import api from '../services/api'
import {
  Upload, FileImage, ShieldAlert, Star, Download,
  CheckCircle, ArrowRight, BookOpen, AlertCircle, RefreshCw
} from 'lucide-react'

interface AnalysisResult {
  id: number
  asset_symbol: string
  asset_type: string
  chart_image_path: string
  is_favorite: boolean
  created_at: string
  analysis_result: {
    asset_symbol: string
    confidence_score: number
    executive_summary: string
    technical_observations: {
      trend_direction: string
      trend_strength: string
      candlestick_patterns: string[]
      chart_patterns: string[]
      momentum: string
      volatility: string
      key_signals: string[]
    }
    support_resistance: {
      support_levels: number[]
      resistance_levels: number[]
    }
    probability_analysis: {
      bullish: number
      bearish: number
      sideways: number
      explanation: string
    }
    opportunity_risk: {
      risk_factors: string[]
      opportunities: string[]
      suggested_risk_management: string
    }
    educational_explanation: string
  }
}

const ChartAnalysis: React.FC = () => {
  const [symbol, setSymbol] = useState('')
  const [assetType, setAssetType] = useState('stock')
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<AnalysisResult[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null)
  const [loadingPhase, setLoadingPhase] = useState(0)
  const [error, setError] = useState('')

  const phases = [
    "Uploading chart image...",
    "Validating chart image clarity...",
    "Parsing candlestick pattern zones...",
    "Extracting support & resistance bounds...",
    "Computing scenario probability indicators...",
    "Compiling intelligence executive report..."
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (loading) {
      interval = setInterval(() => {
        setLoadingPhase(prev => (prev + 1) % phases.length)
      }, 3000)
    } else {
      setLoadingPhase(0)
    }
    return () => clearInterval(interval)
  }, [loading])

  const fetchHistory = async () => {
    try {
      const response = await api.get('/analysis/history')
      setHistory(response.data)
      if (response.data.length > 0 && !selectedAnalysis) {
        setSelectedAnalysis(response.data[0])
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !symbol) {
      setError('Please specify the asset symbol and select a chart image.')
      return
    }

    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('asset_symbol', symbol.toUpperCase())
    formData.append('asset_type', assetType)

    try {
      const response = await api.post('/analysis/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      const newAnalysis = response.data
      setHistory(prev => [newAnalysis, ...prev])
      setSelectedAnalysis(newAnalysis)
      setFile(null)
      setSymbol('')
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Analysis failed. Please verify image formatting.')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (id: number) => {
    try {
      const response = await api.put(`/analysis/${id}/favorite`)
      const updated = response.data
      setHistory(prev => prev.map(a => a.id === id ? updated : a))
      if (selectedAnalysis && selectedAnalysis.id === id) {
        setSelectedAnalysis(updated)
      }
    } catch (err) {
       console.error('Failed to favorite record:', err)
    }
  }

  const deleteRecord = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this analysis report?")) return
    try {
      await api.delete(`/analysis/${id}`)
      setHistory(prev => prev.filter(a => a.id !== id))
      if (selectedAnalysis && selectedAnalysis.id === id) {
        setSelectedAnalysis(null)
      }
    } catch (err) {
      console.error('Failed to delete analysis:', err)
    }
  }

  const downloadReport = async (id: number, format: 'pdf' | 'csv') => {
    try {
      const response = await api.get(`/analysis/${id}/export/${format}`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: format === 'pdf' ? 'text/plain' : 'text/csv' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `report_${format === 'pdf' ? 'summary' : 'data'}_${id}.${format === 'pdf' ? 'txt' : 'csv'}`
      link.click()
    } catch (err) {
      console.error('Export download failed:', err)
    }
  }

  return (
    <div className="flex h-full overflow-hidden max-w-[1600px] mx-auto">
      {/* History Sidebar */}
      <div className="w-80 border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col shrink-0 bg-white dark:bg-slate-900/40">
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex justify-between items-center">
          <h3 className="font-bold text-sm">Analysis Database</h3>
          <button onClick={fetchHistory} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {history.length > 0 ? (
            history.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedAnalysis(h)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${selectedAnalysis?.id === h.id ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-900 dark:text-indigo-200' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm uppercase tracking-tight">{h.asset_symbol}</span>
                  <div className="flex items-center gap-1">
                    {h.is_favorite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                    <span className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">{h.analysis_result.executive_summary}</p>
              </button>
            ))
          ) : (
            <div className="text-center text-xs text-slate-400 italic py-10">No records found.</div>
          )}
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/20">
        {/* Upload Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold mb-4">Execute AI Technical chart Upload</h2>
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Asset Symbol</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AAPL or BTC"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:border-indigo-500 uppercase transition-colors"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Market Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssetType('stock')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${assetType === 'stock' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500'}`}
                  >
                    Stock Chart
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetType('crypto')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${assetType === 'crypto' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500'}`}
                  >
                    Crypto Chart
                  </button>
                </div>
              </div>
            </div>

            {/* Drop Zone */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Chart Image (PNG, JPG, WEBP)</label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl flex flex-col justify-center items-center py-6 px-4 cursor-pointer transition-all ${dragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30'}`}
              >
                <input
                  type="file"
                  id="chart-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <label htmlFor="chart-upload" className="flex flex-col items-center cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold">
                    {file ? file.name : "Drag & drop your chart file, or select a file"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">Maximum 5MB limit</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-lg transition-all"
              >
                {loading ? 'Evaluating...' : 'Initiate Analysis'}
              </button>
            </div>
          </form>
        </div>

        {/* Display Loading Phase */}
        {loading && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-8 rounded-2xl text-center space-y-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-semibold animate-pulse text-indigo-500 dark:text-indigo-400">
              {phases[loadingPhase]}
            </p>
          </div>
        )}

        {/* Selected Analysis Breakdown */}
        {selectedAnalysis && !loading && (
          <div className="space-y-6">
            {/* Header / Actions strip */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-xl shadow-sm">
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  {selectedAnalysis.asset_symbol} Report
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded uppercase">
                    {selectedAnalysis.asset_type}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Analyzed on: {new Date(selectedAnalysis.created_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleFavorite(selectedAnalysis.id)}
                  className={`p-2 border rounded-lg transition-all ${selectedAnalysis.is_favorite ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400'}`}
                >
                  <Star className={`w-4 h-4 ${selectedAnalysis.is_favorite ? 'fill-amber-500' : ''}`} />
                </button>
                <button
                  onClick={() => downloadReport(selectedAnalysis.id, 'csv')}
                  className="p-2 border border-slate-200 dark:border-slate-850 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all flex items-center gap-1 text-xs font-semibold"
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
                <button
                  onClick={() => downloadReport(selectedAnalysis.id, 'pdf')}
                  className="p-2 border border-slate-200 dark:border-slate-850 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all flex items-center gap-1 text-xs font-semibold"
                >
                  <FileImage className="w-4 h-4" /> Printable TXT
                </button>
                <button
                  onClick={() => deleteRecord(selectedAnalysis.id)}
                  className="p-2 border border-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all text-xs font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Layout Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (Key Summaries, Probabilities & Educational explaining) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Executive Summary */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm space-y-3">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Executive Summary</h4>
                  <p className="text-sm leading-relaxed">{selectedAnalysis.analysis_result.executive_summary}</p>
                </div>

                {/* Probability Distribution */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Scenario Probabilities</h4>
                  <div className="space-y-3">
                    {/* Bullish */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-emerald-500">Bullish Scenario</span>
                        <span>{selectedAnalysis.analysis_result.probability_analysis.bullish}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${selectedAnalysis.analysis_result.probability_analysis.bullish}%` }}></div>
                      </div>
                    </div>
                    {/* Bearish */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-rose-500">Bearish Scenario</span>
                        <span>{selectedAnalysis.analysis_result.probability_analysis.bearish}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: `${selectedAnalysis.analysis_result.probability_analysis.bearish}%` }}></div>
                      </div>
                    </div>
                    {/* Sideways */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-amber-500">Sideways / Consolidation</span>
                        <span>{selectedAnalysis.analysis_result.probability_analysis.sideways}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${selectedAnalysis.analysis_result.probability_analysis.sideways}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 italic leading-relaxed">
                    {selectedAnalysis.analysis_result.probability_analysis.explanation}
                  </p>
                </div>

                {/* Educational Explanation */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm space-y-3">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500" /> Pattern Education Info
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {selectedAnalysis.analysis_result.educational_explanation}
                  </p>
                </div>
              </div>

              {/* Right Column (Indicators & Levels, Risk Controls) */}
              <div className="space-y-6">
                {/* Tech Signals & Confidence */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Confidence</span>
                    <span className="text-sm font-bold text-indigo-500">{selectedAnalysis.analysis_result.confidence_score}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Trend:</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {selectedAnalysis.analysis_result.technical_observations.trend_direction} ({selectedAnalysis.analysis_result.technical_observations.trend_strength})
                    </span>
                  </div>

                  <hr className="border-slate-200/60 dark:border-slate-800/60" />

                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Patterns Seen</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAnalysis.analysis_result.technical_observations.chart_patterns.map((p, i) => (
                        <span key={i} className="text-[10px] font-bold bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                      {selectedAnalysis.analysis_result.technical_observations.candlestick_patterns.map((p, i) => (
                        <span key={i} className="text-[10px] font-bold bg-cyan-500/10 text-cyan-500 px-2 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Support & Resistance Price Bands */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Key Price Levels</h4>
                  <div>
                    <span className="text-xs font-semibold text-emerald-500 block mb-2">Support Levels</span>
                    <div className="space-y-1.5">
                      {selectedAnalysis.analysis_result.support_resistance.support_levels.map((lvl, i) => (
                        <div key={i} className="flex justify-between items-center text-xs p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                          <span className="font-semibold text-slate-400">Level {i+1}</span>
                          <span className="font-bold text-emerald-500">${lvl.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-rose-500 block mb-2">Resistance Levels</span>
                    <div className="space-y-1.5">
                      {selectedAnalysis.analysis_result.support_resistance.resistance_levels.map((lvl, i) => (
                        <div key={i} className="flex justify-between items-center text-xs p-2 bg-rose-500/5 rounded-lg border border-rose-500/10">
                          <span className="font-semibold text-slate-400">Level {i+1}</span>
                          <span className="font-bold text-rose-500">${lvl.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Risk and strategy */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Risk Assessment</h4>
                  <div className="space-y-2 text-xs">
                    <span className="font-semibold text-rose-400 block">Critical Risk Factors:</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400">
                      {selectedAnalysis.analysis_result.opportunity_risk.risk_factors.map((rf, i) => (
                        <li key={i}>{rf}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 text-xs">
                    <span className="font-semibold text-indigo-400 block">Suggested Sizing / Parameters:</span>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60">
                      {selectedAnalysis.analysis_result.opportunity_risk.suggested_risk_management}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer strip */}
            <div className="flex items-center gap-2.5 p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-xl text-xs text-slate-500 dark:text-slate-400">
              <ShieldAlert className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>
                <strong>Disclaimer:</strong> This report is AI-assisted and for educational purposes only. It is not financial advice.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChartAnalysis
