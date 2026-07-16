import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { Eye, Plus, Trash2, Edit2, Check, X, Tag, FileText } from 'lucide-react'

interface WatchlistItem {
  id: number
  symbol: string
  asset_type: string
  notes: string
  tags: string
}

const Watchlist: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [symbol, setSymbol] = useState('')
  const [assetType, setAssetType] = useState('stock')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Inline editing state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editTags, setEditTags] = useState('')

  const fetchWatchlist = async () => {
    try {
      const response = await api.get('/watchlist')
      setWatchlist(response.data)
    } catch (err) {
      console.error('Failed to load watchlist:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!symbol) {
      setError('Please provide a symbol')
      return
    }

    try {
      await api.post('/watchlist', {
        symbol: symbol.toUpperCase(),
        asset_type: assetType,
        notes,
        tags
      })
      setSymbol('')
      setNotes('')
      setTags('')
      fetchWatchlist()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to add ticker.')
    }
  }

  const deleteItem = async (id: number) => {
    try {
      await api.delete(`/watchlist/${id}`)
      setWatchlist(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      console.error('Failed to remove from watchlist:', err)
    }
  }

  const startEdit = (item: WatchlistItem) => {
    setEditingId(item.id)
    setEditNotes(item.notes || '')
    setEditTags(item.tags || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (id: number) => {
    try {
      const response = await api.put(`/watchlist/${id}?notes=${encodeURIComponent(editNotes)}&tags=${encodeURIComponent(editTags)}`)
      const updated = response.data
      setWatchlist(prev => prev.map(w => w.id === id ? updated : w))
      setEditingId(null)
    } catch (err) {
      console.error('Failed to update watchlist entry:', err)
    }
  }

  if (loading) {
    return (
      <div className="p-8 h-full space-y-6 animate-pulse text-slate-400">
        <div className="h-8 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 overflow-y-auto h-full max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Watchlist Manager</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Monitor indices, write key observation comments, and tag tickers for categorizing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Watchlist card layout */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-500" /> Monitored Assets
              </h3>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {watchlist.length > 0 ? (
                watchlist.map((item) => (
                  <div key={item.id} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold uppercase tracking-tight">{item.symbol}</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded capitalize">
                          {item.asset_type}
                        </span>
                      </div>

                      {editingId === item.id ? (
                        <div className="space-y-2 mt-2">
                          <input
                            type="text"
                            className="w-full px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add notes..."
                          />
                          <input
                            type="text"
                            className="w-full px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            placeholder="Add tags (comma separated)..."
                          />
                        </div>
                      ) : (
                        <>
                          {item.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {item.notes}
                            </p>
                          )}
                          {item.tags && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.tags.split(',').map((t, idx) => (
                                <span key={idx} className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                                  <Tag className="w-2 h-2 shrink-0" /> {t.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 shrink-0">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 border border-rose-500/10 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-xs text-slate-400 italic">No tickers watchlisted yet. Add an asset using the controls on the right.</div>
              )}
            </div>
          </div>
        </div>

        {/* Add Ticker panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm h-fit">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-500" /> Watch Ticker
          </h3>

          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-lg text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Asset Ticker Symbol</label>
              <input
                type="text"
                required
                placeholder="e.g. MSFT or SOL"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs focus:outline-none focus:border-indigo-500 uppercase"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Sector Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssetType('stock')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${assetType === 'stock' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-550'}`}
                >
                  Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAssetType('crypto')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${assetType === 'crypto' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-550'}`}
                >
                  Crypto
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Internal Note (Optional)</label>
              <textarea
                rows={2}
                placeholder="Key resistance observations..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Tags (Optional, comma-split)</label>
              <input
                type="text"
                placeholder="tech, breakout, core"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow"
            >
              Add to Watchlist
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Watchlist
