import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  TrendingUp, TrendingDown, Briefcase, Eye, Award, Clock,
  FileText, Activity, ArrowUpRight, DollarSign, Wallet
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

interface PortfolioAsset {
  symbol: string
  asset_type: string
  shares_quantity: number
  average_buy_price: number
  current_price: number
  current_value: number
  profit_loss: number
}

interface AnalysisItem {
  id: number
  asset_symbol: string
  asset_type: string
  created_at: string
  is_favorite: boolean
  analysis_result: {
    confidence_score: number
    executive_summary: string
    technical_observations: {
      trend_direction: string
    }
  }
}

interface WatchlistItem {
  id: number
  symbol: string
  notes: string
  tags: string
}

const Dashboard: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([])
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portRes, analRes, watchRes] = await Promise.all([
          api.get('/portfolio'),
          api.get('/analysis/history?limit=5'),
          api.get('/watchlist')
        ])
        setPortfolio(portRes.data)
        setAnalyses(analRes.data)
        setWatchlist(watchRes.data)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Portfolio calculations
  const totalCost = portfolio.reduce((acc, curr) => acc + (curr.shares_quantity * curr.average_buy_price), 0)
  const totalValue = portfolio.reduce((acc, curr) => acc + curr.current_value, 0)
  const totalProfitLoss = totalValue - totalCost
  const profitLossPct = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0

  // Asset allocation mapping
  const allocationData = portfolio.map(asset => ({
    name: asset.symbol,
    value: asset.current_value
  }))

  const COLORS = ['#2563EB', '#06B6D4', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B']

  // Mock historical performance chart
  const performanceHistory = [
    { name: 'Jan', value: totalCost * 0.95 || 9500 },
    { name: 'Feb', value: totalCost * 0.98 || 9800 },
    { name: 'Mar', value: totalCost * 1.02 || 10200 },
    { name: 'Apr', value: totalCost * 1.05 || 10500 },
    { name: 'May', value: totalCost * 1.03 || 10300 },
    { name: 'Jun', value: totalValue || 11200 }
  ]

  // Mock global market indicators
  const marketIndices = [
    { name: 'S&P 500', value: '5,432.75', change: '+0.85%', isUp: true },
    { name: 'Nasdaq 100', value: '18,672.30', change: '+1.20%', isUp: true },
    { name: 'Bitcoin (BTC)', value: '$64,250.00', change: '-1.40%', isUp: false },
    { name: 'Ethereum (ETH)', value: '$3,510.50', change: '+0.45%', isUp: true }
  ]

  if (loading) {
    return (
      <div className="p-8 h-full overflow-y-auto space-y-8 animate-pulse text-slate-400">
        <div className="h-10 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-xl lg:col-span-2"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 overflow-y-auto h-full max-w-[1600px] mx-auto">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Market Intelligence Console</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics, portfolio health and AI-assisted chart assessments.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/analysis"
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm"
          >
            <Award className="w-4 h-4" /> New AI Chart Analysis
          </Link>
        </div>
      </div>

      {/* Ticker strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {marketIndices.map((idx, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-xl shadow-sm flex justify-between items-center">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{idx.name}</p>
              <h4 className="text-lg font-bold mt-1 tracking-tight">{idx.value}</h4>
            </div>
            <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${idx.isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {idx.isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
              {idx.change}
            </div>
          </div>
        ))}
      </div>

      {/* Top statistics counts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Portfolio Assets Value</p>
            <h3 className="text-2xl font-bold mt-1">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className={`inline-flex items-center text-xs font-semibold mt-1 ${totalProfitLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({profitLossPct.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Saved Analyses</p>
            <h3 className="text-2xl font-bold mt-1">{analyses.length}</h3>
            <span className="text-xs text-slate-400 font-medium">Latest: {analyses[0]?.asset_symbol || 'None'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Watchlist Count</p>
            <h3 className="text-2xl font-bold mt-1">{watchlist.length} Tickers</h3>
            <span className="text-xs text-slate-400 font-medium">Active triggers loaded</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Risk Evaluation</p>
            <h3 className="text-2xl font-bold mt-1">42 / 100</h3>
            <span className="text-xs text-emerald-500 font-semibold">Conservative-Moderate</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Allocation split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold">Portfolio Growth Timeline</h3>
              <p className="text-xs text-slate-400">Historical performance estimation</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-300">
              6 Months
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceHistory}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={v => [`$${parseFloat(v as string).toFixed(2)}`, 'Value']} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold">Asset Allocation</h3>
            <p className="text-xs text-slate-400 mb-6">Distribution by asset symbol value</p>
          </div>
          <div className="h-48 w-full relative flex justify-center items-center">
            {portfolio.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => `$${parseFloat(v as string).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 italic text-center">No portfolio holdings recorded yet. Add assets to see allocation.</div>
            )}
          </div>
          <div className="space-y-2 mt-4 max-h-32 overflow-y-auto pr-2">
            {portfolio.map((asset, index) => (
              <div key={asset.symbol} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="font-semibold">{asset.symbol}</span>
                  <span className="text-slate-400 uppercase">({asset.asset_type})</span>
                </div>
                <span className="font-bold">${asset.current_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom split: Recent Analyses & Watchlist preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Analyses list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" /> Recent Chart Uploads
            </h3>
            <Link to="/analysis" className="text-indigo-500 hover:text-indigo-600 text-xs font-semibold flex items-center gap-1">
              View History <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {analyses.length > 0 ? (
              analyses.slice(0, 3).map((a) => (
                <div key={a.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded uppercase">{a.asset_symbol}</span>
                      <span className="text-xs text-slate-400 capitalize">{a.asset_type}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{a.analysis_result.executive_summary}</p>
                  </div>
                  <div className="flex sm:flex-col items-start sm:items-end justify-between shrink-0">
                    <span className="text-xs text-slate-400 font-medium">{new Date(a.created_at).toLocaleDateString()}</span>
                    <span className={`text-xs font-bold mt-1 px-2.5 py-0.5 rounded-full ${a.analysis_result.technical_observations.trend_direction === 'Bullish' ? 'bg-emerald-500/10 text-emerald-500' : a.analysis_result.technical_observations.trend_direction === 'Bearish' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {a.analysis_result.technical_observations.trend_direction}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-400 italic">No charts analyzed yet. Drag & drop a market chart to get started!</div>
            )}
          </div>
        </div>

        {/* Watchlist Quick View */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-500" /> Watchlist Overview
              </h3>
              <Link to="/watchlist" className="text-indigo-500 hover:text-indigo-600 text-xs font-semibold flex items-center gap-1">
                Manage <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {watchlist.length > 0 ? (
                watchlist.slice(0, 4).map((w) => (
                  <div key={w.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-850 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-sm tracking-tight">{w.symbol}</span>
                      {w.notes && <p className="text-slate-400 mt-1 line-clamp-1">{w.notes}</p>}
                    </div>
                    {w.tags && (
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold px-2 py-0.5 rounded">
                        {w.tags.split(',')[0]}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-xs text-slate-400 italic">No tickers watchlisted. Click manage to add symbols.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
