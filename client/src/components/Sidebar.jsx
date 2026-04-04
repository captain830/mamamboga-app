import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice'
import { 
  FiHome, FiPackage, FiShoppingCart, FiMessageSquare, 
  FiUser, FiLogOut, FiBarChart2, FiSettings, FiX,
  FiTruck, FiCreditCard, FiUsers  // Add FiUsers here
} from 'react-icons/fi'
import toast from 'react-hot-toast'

const Sidebar = ({ onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

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

  return (
    <div className="h-full bg-gradient-to-b from-green-700 to-green-900 text-white flex flex-col shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🥬</span>
            <div>
              <h1 className="text-xl font-bold">Mama Mboga</h1>
              <p className="text-xs text-white/70">Fresh Produce Delivery</p>
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
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <FiUser className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">{user?.name || 'Guest'}</p>
            <p className="text-xs text-white/70 capitalize">{user?.role || 'customer'}</p>
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
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
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
            <div className="px-4 mb-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Admin</p>
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
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
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
      <div className="p-4 border-t border-white/20">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          <FiLogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
        <p className="text-xs text-white/40 text-center mt-4">
          © 2024 Mama Mboga
        </p>
      </div>
    </div>
  )
}

export default Sidebar