import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brain, Lock, Mail, Users, CheckCircle, AlertTriangle } from 'lucide-react'

const Register: React.FC = () => {
  const { registerUser } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('retail')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await registerUser(email, password, role)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Registration failed. Check network or server status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-950 to-indigo-950 px-4">
      {/* Background radial effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass p-8 rounded-2xl shadow-glassDark text-white relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-indigo-600 rounded-xl mb-3 shadow-lg shadow-indigo-600/30">
            <Brain className="w-8 h-8 text-cyan-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-sm text-slate-400 mt-1">Register for MarketMind AI Platform</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 p-3 rounded-lg text-sm mb-5 animate-pulse">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-sm mb-5">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Registration successful! Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                placeholder="analyst@firm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Role
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <select
                className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors text-sm appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="retail" className="bg-slate-950">Retail Investor</option>
                <option value="trader" className="bg-slate-950">Professional Trader</option>
                <option value="analyst" className="bg-slate-950">Financial Analyst</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-medium py-2.5 rounded-lg shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] transition-all disabled:opacity-50 text-sm"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
