import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice'
import { 
  FiHome, FiPackage, FiShoppingCart, FiMessageSquare, 
  FiUser, FiLogOut, FiBarChart2, FiSettings, FiX,
  FiTruck, FiCreditCard, FiUsers
} from 'react-icons/fi'
import toast from 'react-hot-toast'

const Sidebar = ({ onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check dark mode on mount and when it changes
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    
    checkDarkMode()
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const navItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/products', icon: FiPackage, label: 'Products' },
    { path: '/cart', icon: FiShoppingCart, label: 'Cart' },
    { path: '/orders', icon: FiTruck, label: 'My Orders' },
    { path: '/payments', icon: FiCreditCard, label: 'Payments' },
    { path: '/feedback', icon: FiMessageSquare, label: 'Feedback' },
    { path: '/profile', icon: FiUser, label: 'Profile' },
  ]

  const adminItems = [
    { path: '/admin', icon: FiBarChart2, label: 'Admin Panel' },
    { path: '/users', icon: FiUsers, label: 'User Management' },
    { path: '/admin/feedback', icon: FiMessageSquare, label: 'Admin Feedback' },
    { path: '/analytics', icon: FiBarChart2, label: 'Analytics' },
    { path: '/reports', icon: FiBarChart2, label: 'Reports' },
    { path: '/settings', icon: FiSettings, label: 'Settings' },
  ]

  // Dynamic classes based on dark mode
  const sidebarBg = isDarkMode 
    ? 'bg-gradient-to-b from-gray-800 to-gray-900' 
    : 'bg-gradient-to-b from-green-700 to-green-900'
  
  const activeBg = isDarkMode ? 'bg-gray-700' : 'bg-white/20'
  const hoverBg = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-white/10'
  const textColor = isDarkMode ? 'text-gray-200' : 'text-white'
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-white/70'
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-white/20'

  return (
    <div className={`h-full ${sidebarBg} ${textColor} flex flex-col shadow-xl transition-all duration-300`}>
      {/* Header */}
      <div className={`p-6 border-b ${borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🥬</span>
            <div>
              <h1 className="text-xl font-bold">Mama Mboga</h1>
              <p className={`text-xs ${textMuted}`}>Fresh Produce Delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-white/10 transition"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className={`p-4 border-b ${borderColor}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <FiUser className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">{user?.name || 'Guest'}</p>
            <p className={`text-xs ${textMuted} capitalize`}>{user?.role || 'customer'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? `${activeBg} ${textColor}`
                    : `${textColor}/80 ${hoverBg} hover:${textColor}`
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Admin Section */}
        {user?.role === 'admin' && (
          <div className="mt-6">
            <div className={`px-4 mb-2 text-xs font-semibold ${textMuted} uppercase tracking-wider`}>
              Admin
            </div>
            <div className="px-4 space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose && onClose()}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? `${activeBg} ${textColor}`
                        : `${textColor}/80 ${hoverBg} hover:${textColor}`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t ${borderColor}`}>
        <button
          onClick={handleLogout}
          className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg ${textColor}/80 ${hoverBg} hover:${textColor} transition-all duration-200`}
        >
          <FiLogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
        <p className={`text-xs ${textMuted} text-center mt-4`}>
          © 2024 Mama Mboga
        </p>
      </div>
    </div>
  )
}

export default Sidebar