import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 90000, // 90s default – provider APIs (AMZAET/SMEPlug) can take 30-40s
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests + boost timeout for service purchase endpoints
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Service purchase endpoints call external APIs – give them more time
  if (config.url?.includes('/services/')) {
    config.timeout = 90000
  }
  return config
})

// Handle responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          })

          const { accessToken } = response.data.data
          localStorage.setItem('accessToken', accessToken)

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        } catch (err) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  },
)

export default api
