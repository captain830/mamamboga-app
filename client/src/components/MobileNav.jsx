import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiHome, FiBox, FiShoppingCart, FiUser } from 'react-icons/fi'

const MobileNav = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: FiHome, label: 'Home' },
    { path: '/products', icon: FiBox, label: 'Products' },
    { path: '/cart', icon: FiShoppingCart, label: 'Cart' },
    { path: '/profile', icon: FiUser, label: 'Profile' },
  ]

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
      <div className="flex justify-around items-center py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                isActive ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default MobileNav