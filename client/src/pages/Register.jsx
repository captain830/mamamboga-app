import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { setCredentials } from '../redux/slices/authSlice'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import SMSVerification from '../components/SMSVerification'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showSMSVerification, setShowSMSVerification] = useState(false)
  const [registeredPhone, setRegisteredPhone] = useState('')
  const [tempUserId, setTempUserId] = useState(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      const { confirmPassword, ...userData } = formData
      const response = await axios.post(`${API_URL}/auth/register`, userData)
      
      // Store temp user info for SMS verification
      setRegisteredPhone(formData.phone)
      setTempUserId(response.data.user.id)
      
      // Show SMS verification instead of navigating away
      setShowSMSVerification(true)
      toast.success('Registration successful! Please verify your phone number.')
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  // If showing SMS verification
  if (showSMSVerification) {
    return (
      <SMSVerification 
        phone={registeredPhone}
        userId={tempUserId}
        onVerified={() => {
          setShowSMSVerification(false)
          toast.success('Phone verified! Your account is pending admin approval.', {
            duration: 5000
          })
          navigate('/login')
        }}
        onBack={() => {
          setShowSMSVerification(false)
        }}
      />
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dynamic Background - Uses CSS variables */}
      <div className="absolute inset-0" style={{
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
        {['🍅', '🥬', '🌽', '🥕', '🍆', '🫑', '🥦', '🌶️', '🍠', '🥒'].map((veg, i) => (
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
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
              <p className="text-gray-500">Join our fresh community</p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all outline-none"
                  style={{ focusRingColor: 'var(--primary)' }}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all outline-none"
                  placeholder="0712345678"
                />
                <p className="text-xs text-gray-500 mt-1">We'll send a verification code to this number</p>
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
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                    Creating Account...
                  </div>
                ) : (
                  'Sign Up'
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold hover:underline transition-colors" style={{ color: 'var(--primary)' }}>
                  Sign In
                </Link>
              </p>
            </div>

            {/* Info note about verification */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 text-center">
                🔒 Accounts require phone verification and admin approval for security.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Register