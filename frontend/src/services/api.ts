import axios from 'axios'

// Dynamically select API endpoint base.
// - On Render: VITE_API_HOST is injected at build time pointing to the backend service host.
// - In Docker (nginx proxy): falls back to same-origin /api/v1.
// - Local dev (port 5173): proxies directly to localhost:8000.
const viteApiHost = import.meta.env.VITE_API_HOST as string | undefined;
const API_BASE = viteApiHost
  ? `https://${viteApiHost}/api/v1`
  : window.location.port === '5173'
    ? 'http://localhost:8000/api/v1'
    : '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
})

// Automatically append token to request headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Catch unauthorized credentials and force logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_email')
      // Redirect to login if user is logged in
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
export { API_BASE }
