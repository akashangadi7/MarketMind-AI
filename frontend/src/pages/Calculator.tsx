import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { DollarSign, Percent, Calculator as CalcIcon, Shield, ArrowUpRight, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface CalcResults {
  position_size: number
  max_loss: number
  expected_profit: number
  risk_reward_ratio: number
  capital_allocation_pct: number
}

const Calculator: React.FC = () => {
  const [capital, setCapital] = useState(10000)
  const [entry, setEntry] = useState(100)
  const [stop, setStop] = useState(95)
  const [target, setTarget] = useState(115)
  const [riskPct, setRiskPct] = useState(2)
  const [error, setError] = useState('')
  const [results, setResults] = useState<CalcResults | null>(null)

  const calculate = async () => {
    setError('')
    if (entry <= 0 || stop <= 0 || target <= 0 || capital <= 0) {
      setError('Values must be greater than zero')
      return
    }
    if (entry === stop) {
      setError('Entry price and Stop Loss cannot be identical')
      return
    }

    try {
      const response = await api.post('/calculator', {
        available_capital: capital,
        entry_price: entry,
        stop_loss: stop,
        target_price: target,
        max_risk_pct: riskPct
      })
      setResults(response.data)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Calculation failed.')
    }
  }

  useEffect(() => {
    calculate()
  }, [capital, entry, stop, target, riskPct])

  // Chart data formatting
  const chartData = results ? [
    { name: 'Risk (Max Loss)', value: results.max_loss, type: 'risk' },
    { name: 'Potential Profit', value: results.expected_profit, type: 'profit' }
  ] : []

  return (
    <div className="p-6 md:p-8 space-y-8 overflow-y-auto h-full max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Risk & Position Calculator</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Evaluate capital allocations, define stop risk parameters, and check risk-reward metrics before placing trades.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inputs panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm space-y-5">
          <h3 className="font-bold text-base flex items-center gap-2">
            <CalcIcon className="w-5 h-5 text-indigo-500" /> Parameter Settings
          </h3>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Available Capital ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  value={capital}
                  onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-2">Entry Price ($)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  value={entry}
                  onChange={(e) => setEntry(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-2">Max Risk (%)</label>
                <div className="relative">
                  <Percent className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    max={100}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    value={riskPct}
                    onChange={(e) => setRiskPct(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-2 text-rose-500">Stop Loss ($)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  value={stop}
                  onChange={(e) => setStop(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-2 text-emerald-500">Target Price ($)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  value={target}
                  onChange={(e) => setTarget(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {results ? (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-xl shadow-sm">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Suggested Position Size</p>
                  <h4 className="text-xl font-bold mt-1 text-indigo-500">{results.position_size.toLocaleString()} Units</h4>
                  <span className="text-[10px] text-slate-400">Contracts or Shares to acquire</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-xl shadow-sm">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-rose-500">Maximum Loss</p>
                  <h4 className="text-xl font-bold mt-1 text-rose-500">${results.max_loss.toLocaleString()}</h4>
                  <span className="text-[10px] text-slate-400">Based on {riskPct}% risk profile</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-xl shadow-sm">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-emerald-500">Target Profit</p>
                  <h4 className="text-xl font-bold mt-1 text-emerald-500">${results.expected_profit.toLocaleString()}</h4>
                  <span className="text-[10px] text-slate-400">At targets of ${target}</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-xl shadow-sm">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Risk / Reward Ratio</p>
                  <h4 className="text-xl font-bold mt-1 flex items-center gap-1">
                    {results.risk_reward_ratio}x
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${results.risk_reward_ratio >= 2.0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {results.risk_reward_ratio >= 2.0 ? 'Optimal' : 'Low R:R'}
                    </span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Ratio above 2.0 is advised</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-xl shadow-sm col-span-2 md:col-span-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Capital Allocated</p>
                  <h4 className="text-xl font-bold mt-1 text-cyan-500">{results.capital_allocation_pct}%</h4>
                  <span className="text-[10px] text-slate-400">(${ (results.position_size * entry).toLocaleString() } of capital)</span>
                </div>
              </div>

              {/* Chart Visualizer */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> Trade Risk vs Reward Visualization
                    </h3>
                    <p className="text-[10px] text-slate-400">Expected payout distribution comparing loss and gain thresholds</p>
                  </div>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `$${v}`} tickLine={false} />
                      <Tooltip formatter={v => [`$${parseFloat(v as string).toLocaleString()}`, 'Amount']} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={120}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.type === 'risk' ? '#EF4444' : '#10B981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-12 rounded-2xl text-center text-xs text-slate-400 italic">
              Adjust configurations to generate position statistics.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Calculator
