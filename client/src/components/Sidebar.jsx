import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice'
import { clearCart } from '../redux/slices/cartSlice'
import { 
  FaHome, 
  FaBox, 
  FaShoppingCart, 
  FaTruck, 
  FaCreditCard, 
  FaUser, 
  FaChartBar, 
  FaCog, 
  FaSignOutAlt, 
  FaLeaf, 
  FaUsers,
  FaComment
} from 'react-icons/fa'

const Sidebar = ({ user, onClose }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearCart())
    if (onClose) onClose()
    navigate('/login')
  }

  const menuItems = [
    { path: '/', icon: FaHome, label: 'Dashboard' },
    { path: '/products', icon: FaBox, label: 'Products' },
    { path: '/cart', icon: FaShoppingCart, label: 'Cart' },
    { path: '/orders', icon: FaTruck, label: 'Orders' },
    { path: '/payments', icon: FaCreditCard, label: 'Payments' },
    { path: '/delivery', icon: FaTruck, label: 'Delivery' },
    { path: '/profile', icon: FaUser, label: 'Profile' },
    { path: '/feedback', icon: FaComment, label: 'Feedback' },
  ]

const adminItems = [
    { path: '/admin', icon: FaUsers, label: 'Admin Panel' },
    { path: '/admin/orders', icon: FaTruck, label: 'Orders' },
    { path: '/admin/feedback', icon: FaComment, label: 'Feedback' },
    { path: '/reports', icon: FaChartBar, label: 'Reports' },
    { path: '/settings', icon: FaCog, label: 'Settings' },
];

  return (
    <div className="h-full w-64 bg-gradient-to-b from-green-700 to-green-900 text-white shadow-xl flex flex-col">
      {/* Close button for mobile */}
      <button
        onClick={onClose}
        className="lg:hidden absolute top-4 right-4 p-2 rounded-lg bg-green-800 text-white z-10"
      >
        ✕
      </button>

      {/* Header */}
      <div className="flex-shrink-0 p-5 border-b border-green-600">
        <div className="flex items-center space-x-2">
          <FaLeaf className="w-6 h-6 text-orange-400" />
          <div>
            <h2 className="text-lg font-bold">Mama Mboga</h2>
            <p className="text-[10px] text-green-300">Fresh & Organic</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="flex-shrink-0 p-4 mx-3 mt-3 bg-green-800 rounded-lg">
        <p className="text-xs text-green-300">Welcome back,</p>
        <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
        <span className="text-[10px] bg-orange-500 px-2 py-0.5 rounded mt-1 inline-block">
          {user?.role === 'admin' ? 'Administrator' : 'Customer'}
        </span>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-green-100 hover:bg-green-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="border-t border-green-600 my-3"></div>
              {adminItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-green-100 hover:bg-green-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <div className="flex-shrink-0 p-4 border-t border-green-600">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-3 px-3 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200 text-sm font-medium"
        >
          <FaSignOutAlt className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar