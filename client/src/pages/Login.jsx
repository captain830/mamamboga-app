import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { setCredentials } from '../redux/slices/authSlice'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await axios.post(`${API_URL}/auth/login`, formData)
      dispatch(setCredentials({
        user: response.data.user,
        token: response.data.token,
      }))
      toast.success('Login successful! Welcome back!')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dynamic Background - Will use CSS variables */}
      <div className="absolute inset-0 bg-gradient-to-br" style={{
        background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)`
      }}>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
        </div>
      </div>

      {/* Floating Vegetables */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['🍅', '🥬', '🌽', '🥕', '🍆', '🫑', '🥦', '🌶️'].map((veg, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl md:text-5xl opacity-10"
            initial={{ y: '100vh', x: `${Math.random() * 100}vw` }}
            animate={{ y: '-20vh', x: `${Math.random() * 100}vw` }}
            transition={{ duration: Math.random() * 20 + 15, repeat: Infinity, ease: 'linear', delay: Math.random() * 5 }}
            style={{ left: `${Math.random() * 100}%` }}
          >
            {veg}
          </motion.div>
        ))}
      </div>

      {/* Main Card */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            {/* Logo */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-4" style={{
                background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)`
              }}>
                <span className="text-4xl">🥬</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
              <p className="text-gray-500">Sign in to continue</p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all outline-none"
                  style={{ focusRingColor: 'var(--primary)' }}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70"
                style={{
                  background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)`
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold hover:underline transition-colors" style={{ color: 'var(--primary)' }}>
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Login