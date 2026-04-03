import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FiBell, FiUser, FiShoppingCart } from 'react-icons/fi'

const Header = ({ user }) => {
  const { totalItems } = useSelector((state) => state.cart)
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <header className="bg-white shadow-sm">
      <div className="flex justify-between items-center px-6 py-3">
        <div>
          <h1 className="text-sm font-semibold text-gray-800">
            Welcome back, <span className="text-green-600">{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
        </div>

        <div className="flex items-center space-x-5">
          <Link to="/cart" className="relative">
            <FiShoppingCart className="w-5 h-5 text-gray-600 hover:text-green-600 transition-colors" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="focus:outline-none"
            >
              <FiBell className="w-5 h-5 text-gray-600 hover:text-green-600 transition-colors" />
            </button>
            
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl z-50 border">
                  <div className="p-3 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-3 text-center text-gray-500 text-sm">
                      No new notifications
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <Link to="/profile">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors">
              <FiUser className="w-4 h-4 text-green-600" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header