import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { Briefcase, ArrowDownRight, ArrowUpRight, Plus, Calendar, Coins, ArrowRightLeft } from 'lucide-react'

interface PortfolioAsset {
  id: number
  symbol: string
  asset_type: string
  shares_quantity: number
  average_buy_price: number
  current_price: number
  current_value: number
  profit_loss: number
  profit_loss_pct: number
}

interface Transaction {
  id: number
  symbol: string
  type: string
  quantity: number
  price: number
  executed_at: string
}

const Portfolio: React.FC = () => {
  const [assets, setAssets] = useState<PortfolioAsset[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [symbol, setSymbol] = useState('')
  const [type, setType] = useState('BUY')
  const [quantity, setQuantity] = useState(0)
  const [price, setPrice] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      const [assetsRes, txRes] = await Promise.all([
        api.get('/portfolio'),
        api.get('/portfolio/transactions')
      ])
      setAssets(assetsRes.data)
      setTransactions(txRes.data)
    } catch (err) {
      console.error('Failed to load portfolio metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (quantity <= 0 || price <= 0 || !symbol) {
      setError('Please specify valid values')
      return
    }

    try {
      await api.post('/portfolio/transaction', {
        symbol: symbol.toUpperCase().strip(),
        type,
        quantity,
        price
      })
      
      setSymbol('')
      setQuantity(0)
      setPrice(0)
      fetchData()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Transaction failed. Check current asset holdings.')
    }
  }

  // Aggregate stats
  const totalCost = assets.reduce((sum, current) => sum + (current.shares_quantity * current.average_buy_price), 0)
  const totalValue = assets.reduce((sum, current) => sum + current.current_value, 0)
  const netPL = totalValue - totalCost
  const netPLPct = totalCost > 0 ? (netPL / totalCost) * 100 : 0

  if (loading) {
    return (
      <div className="p-8 h-full space-y-8 animate-pulse text-slate-400">
        <div className="h-8 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 overflow-y-auto h-full max-w-[1500px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Portfolio Manager</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track average purchase values, compute real-time balances, and manage historical transactions.
          </p>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Valuation</p>
          <h4 className="text-2xl font-bold mt-1 text-indigo-500">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
          <span className="text-[10px] text-slate-400">Cost Basis: ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit / Loss</p>
          <h4 className={`text-2xl font-bold mt-1 ${netPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {netPL >= 0 ? '+' : ''}${netPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h4>
          <span className={`text-xs font-bold ${netPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {netPLPct.toFixed(2)}% net change
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset Holdings</p>
          <h4 className="text-2xl font-bold mt-1">{assets.length} Active Positions</h4>
          <span className="text-[10px] text-slate-400">Crypto & Stock sectors monitored</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ledger table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-500" /> Active Holdings
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                    <th className="p-4">Symbol</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Average Buy Price</th>
                    <th className="p-4">Current Price</th>
                    <th className="p-4">Value</th>
                    <th className="p-4">Profit / Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assets.length > 0 ? (
                    assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="p-4 font-bold flex items-center gap-1.5 uppercase">
                          <Coins className="w-4 h-4 text-slate-400" /> {asset.symbol}
                        </td>
                        <td className="p-4">{asset.shares_quantity.toLocaleString()}</td>
                        <td className="p-4">${asset.average_buy_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4">${asset.current_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 font-bold">${asset.current_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className={`p-4 font-bold ${asset.profit_loss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {asset.profit_loss >= 0 ? '+' : ''}${asset.profit_loss.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({asset.profit_loss_pct.toFixed(2)}%)
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-xs text-slate-400 italic">No holdings recorded yet. Record a BUY transaction on the side to begin.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Transaction Logger Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-500" /> Log Transaction
            </h3>

            {error && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-lg text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Asset Symbol</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BTC or NVDA"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs focus:outline-none focus:border-indigo-500 uppercase"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('BUY')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${type === 'BUY' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-550'}`}
                  >
                    BUY Position
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('SELL')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${type === 'SELL' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-550'}`}
                  >
                    SELL Position
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    value={price || ''}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow shadow-indigo-600/10"
              >
                Log Transaction
              </button>
            </form>
          </div>

          {/* Transactions Ledger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-cyan-500" /> Transaction Logs
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/60 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-extrabold px-1.5 py-0.5 rounded text-[9px] ${tx.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{tx.type}</span>
                        <span className="font-bold uppercase tracking-tight">{tx.symbol}</span>
                      </div>
                      <span className="text-[10px] text-slate-450 block mt-1">{new Date(tx.executed_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold block">{tx.quantity.toLocaleString()} shares</span>
                      <span className="text-[10px] text-slate-450">@ ${tx.price.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-slate-400 italic py-6">No transactions recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Portfolio
