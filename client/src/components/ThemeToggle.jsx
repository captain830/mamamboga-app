import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ThemeToggle = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('fresh')
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 80 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef(null)
  const startPos = useRef({ x: 0, y: 0 })

  const themes = [
    { id: 'fresh', name: 'Fresh Green', icon: '🥬', primary: '#2e7d32', primaryDark: '#1b5e20' },
    { id: 'sunset', name: 'Sunset', icon: '🌅', primary: '#ea580c', primaryDark: '#c2410c' },
    { id: 'ocean', name: 'Ocean Blue', icon: '🌊', primary: '#2563eb', primaryDark: '#1d4ed8' },
    { id: 'royal', name: 'Royal Purple', icon: '👑', primary: '#9333ea', primaryDark: '#7e22ce' },
    { id: 'candy', name: 'Candy Pink', icon: '🍬', primary: '#db2777', primaryDark: '#be185d' }
  ]

  useEffect(() => {
    // Load saved theme and position
    const savedTheme = localStorage.getItem('theme') || 'fresh'
    const savedPosition = localStorage.getItem('themePosition')
    setCurrentTheme(savedTheme)
    applyTheme(savedTheme)
    
    if (savedPosition) {
      const pos = JSON.parse(savedPosition)
      setPosition(pos)
    }
  }, [])

  const applyTheme = (themeId) => {
    const theme = themes.find(t => t.id === themeId)
    if (!theme) return

    document.documentElement.style.setProperty('--primary', theme.primary)
    document.documentElement.style.setProperty('--primary-dark', theme.primaryDark)
    
    const gradients = {
      fresh: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
      sunset: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      ocean: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      royal: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
      candy: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)'
    }
    
    document.body.style.background = gradients[themeId] || gradients.fresh
    localStorage.setItem('theme', themeId)
  }

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId)
    applyTheme(themeId)
    setIsOpen(false)
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
    startPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    let newX = e.clientX - startPos.current.x
    let newY = e.clientY - startPos.current.y
    
    // Keep within screen bounds
    newX = Math.min(Math.max(newX, 0), window.innerWidth - 50)
    newY = Math.min(Math.max(newY, 0), window.innerHeight - 50)
    
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      // Save position to localStorage
      localStorage.setItem('themePosition', JSON.stringify(position))
    }
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, position])

  const currentThemeData = themes.find(t => t.id === currentTheme)

  return (
    <div
      ref={dragRef}
      className="fixed z-50 cursor-move"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div className="relative">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl p-1 border border-gray-200 min-w-[140px]"
              style={{ cursor: 'default' }}
            >
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => changeTheme(theme.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    currentTheme === theme.id
                      ? 'text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  style={currentTheme === theme.id ? {
                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`
                  } : {}}
                >
                  <span>{theme.icon}</span>
                  <span className="flex-1 text-left">{theme.name}</span>
                  {currentTheme === theme.id && <span>✓</span>}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseDown={handleMouseDown}
          onClick={(e) => {
            // Only toggle if not dragging
            if (!isDragging) {
              setIsOpen(!isOpen)
            }
          }}
          className="w-10 h-10 rounded-full text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${currentThemeData?.primary} 0%, ${currentThemeData?.primaryDark} 100%)`,
            cursor: 'grab'
          }}
        >
          <span className="text-lg">🎨</span>
        </motion.button>
        
        {/* Drag indicator dot */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white/50 rounded-full opacity-50"></div>
      </div>
    </div>
  )
}

export default ThemeToggle