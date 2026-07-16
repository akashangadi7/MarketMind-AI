import React from 'react'
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ChartAnalysis from './pages/ChartAnalysis'
import Calculator from './pages/Calculator'
import Portfolio from './pages/Portfolio'
import Watchlist from './pages/Watchlist'
import AdminDashboard from './pages/AdminDashboard'
import {
  LayoutDashboard, Award, Calculator as CalcIcon,
  Briefcase, Eye, Shield, LogOut, Sun, Moon, Brain, Menu, X
} from 'lucide-react'

// Route Guard to verify auth credentials
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-500 font-semibold animate-pulse">
        Initializing Console...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const AppContent: React.FC = () => {
  const { isAuthenticated, user, logout, theme, toggleTheme } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Chart Analysis', path: '/analysis', icon: Award },
    { name: 'Risk Calculator', path: '/calculator', icon: CalcIcon },
    { name: 'Portfolio Manager', path: '/portfolio', icon: Briefcase },
    { name: 'Watchlist', path: '/watchlist', icon: Eye },
  ]

  // Add Admin Console option if user is admin
  if (user?.role === 'admin') {
    menuItems.push({ name: 'Admin Console', path: '/admin', icon: Shield })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 glass border-r border-slate-200/60 dark:border-slate-800/60 h-full select-none shrink-0 z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-200/60 dark:border-slate-850">
          <div className="p-2 bg-indigo-600 rounded-xl shadow shadow-indigo-600/30">
            <Brain className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight leading-none">MarketMind AI</h1>
            <span className="text-[10px] text-indigo-500 font-semibold tracking-wider uppercase block mt-1">Enterprise Hub</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:scale-[1.01]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-slate-850'}`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User bar / Footer controls */}
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-850 space-y-4">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold truncate">{user?.email}</p>
              <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-widest">{user?.role}</span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-indigo-500 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 py-2.5 rounded-xl text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main shell view */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60 z-30">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-500" />
            <span className="font-extrabold text-sm tracking-tight">MarketMind AI</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 border border-slate-200 dark:border-slate-805 rounded-xl text-slate-450"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 border border-slate-200 dark:border-slate-805 rounded-xl text-slate-450"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden flex justify-end">
            <div className="w-64 bg-slate-50 dark:bg-slate-900 h-full p-6 flex flex-col border-l border-slate-200 dark:border-slate-800 shadow-2xl relative">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mt-8 flex-1 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                  <p className="text-xs font-bold truncate">{user?.email}</p>
                  <span className="text-[9px] text-indigo-500 uppercase tracking-widest block font-bold">{user?.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 border border-rose-500/20 text-rose-500 py-2 rounded-xl text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Viewport for main page content */}
        <main className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/analysis" element={<ProtectedRoute><ChartAnalysis /></ProtectedRoute>} />
            <Route path="/calculator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
