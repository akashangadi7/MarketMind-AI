import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { Shield, Users, Activity, BarChart, Server, Check, Ban, UserCheck } from 'lucide-react'

interface SystemStats {
  total_users: number
  active_users: number
  total_analyses: number
  saved_reports: number
  average_confidence: number
}

interface UserProfile {
  id: number
  email: string
  role: string
  is_active: boolean
  created_at: string
}

interface AuditLog {
  id: number
  user_id?: number
  email?: string
  action: string
  ip_address?: string
  timestamp: string
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/logs')
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setLogs(logsRes.data)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Forbidden. Administrative clearance required.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  const toggleUserStatus = async (id: number) => {
    try {
      await api.put(`/admin/users/${id}/toggle-active`)
      fetchAdminData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Action failed')
    }
  }

  const changeRole = async (id: number, role: string) => {
    try {
      await api.put(`/admin/users/${id}/role?role=${role}`)
      fetchAdminData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Action failed')
    }
  }

  if (loading) {
    return (
      <div className="p-8 h-full space-y-6 animate-pulse text-slate-400">
        <div className="h-8 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col justify-center items-center h-full text-center space-y-4">
        <Shield className="w-16 h-16 text-rose-500" />
        <h3 className="text-xl font-bold">Access Denied</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 overflow-y-auto h-full max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8 text-indigo-500" /> Administrative Console
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Monitor platform metrics, control accounts statuses, and audit security actions.
        </p>
      </div>

      {/* KPI stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Registers</p>
            <h4 className="text-2xl font-extrabold mt-1">{stats.total_users}</h4>
            <span className="text-[10px] text-emerald-500 font-semibold">{stats.active_users} Accounts Active</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Charts Processed</p>
            <h4 className="text-2xl font-extrabold mt-1">{stats.total_analyses}</h4>
            <span className="text-[10px] text-slate-400">Total API calls recorded</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Saved Reports</p>
            <h4 className="text-2xl font-extrabold mt-1">{stats.saved_reports}</h4>
            <span className="text-[10px] text-slate-400">Marked as favorite</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Average Confidence</p>
            <h4 className="text-2xl font-extrabold mt-1 text-indigo-500">{stats.average_confidence}%</h4>
            <span className="text-[10px] text-slate-400">Avg AI output scores</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* User accounts console */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5">
            <Users className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm">Account Authorizations</h3>
          </div>
          <div className="overflow-x-auto flex-1 max-h-[480px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-400 font-bold border-b border-slate-105 dark:border-slate-800">
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="p-4 font-semibold">{u.email}</td>
                    <td className="p-4 uppercase text-[10px] font-bold text-slate-500">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded focus:outline-none"
                      >
                        <option value="retail">retail</option>
                        <option value="trader">trader</option>
                        <option value="analyst">analyst</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold ${u.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded transition-colors ${u.is_active ? 'border border-rose-500/20 text-rose-500 hover:bg-rose-500/10' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500'}`}
                      >
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Audit logs ledger */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-cyan-500" />
            <h3 className="font-bold text-sm">Security Audit Ledger</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[480px] space-y-3">
            {logs.length > 0 ? (
              logs.map(log => (
                <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded tracking-tight text-[10px]">
                      {log.action}
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                      User: <strong className="text-slate-700 dark:text-slate-350">{log.email || 'System'}</strong>
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400">
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-slate-400 italic py-10">No actions logged yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
