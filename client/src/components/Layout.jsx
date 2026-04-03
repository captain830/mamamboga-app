import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileNav from './MobileNav'
import { FiMenu } from 'react-icons/fi'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [sidebarOpen])

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [sidebarOpen])

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 z-50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0
        `}
      >
        <Sidebar user={user} onClose={closeSidebar} />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <FiMenu className="w-5 h-5 text-green-600" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-green-600">Mama Mboga</span>
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block flex-shrink-0">
          <Header user={user} />
        </div>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className={`p-4 ${isMobile ? 'pb-24' : 'pb-4'}`}>
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && !sidebarOpen && (
          <div className="flex-shrink-0 lg:hidden">
            <MobileNav />
          </div>
        )}
      </div>
    </div>
  )
}

export default Layout