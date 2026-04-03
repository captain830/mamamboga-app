import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ThemeToggle = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('sunset')

  const themes = [
    { 
      id: 'sunset', 
      name: 'Sunset', 
      icon: '🌅', 
      primary: '#ea580c',
      primaryDark: '#c2410c',
      accent: '#f97316'
    },
    { 
      id: 'fresh', 
      name: 'Fresh Green', 
      icon: '🥬', 
      primary: '#2e7d32',
      primaryDark: '#1b5e20',
      accent: '#ff9800'
    },
    { 
      id: 'ocean', 
      name: 'Ocean Blue', 
      icon: '🌊', 
      primary: '#2563eb',
      primaryDark: '#1d4ed8',
      accent: '#06b6d4'
    },
    { 
      id: 'royal', 
      name: 'Royal Purple', 
      icon: '👑', 
      primary: '#9333ea',
      primaryDark: '#7e22ce',
      accent: '#e879f9'
    },
    { 
      id: 'candy', 
      name: 'Candy Pink', 
      icon: '🍬', 
      primary: '#db2777',
      primaryDark: '#be185d',
      accent: '#f472b6'
    }
  ]

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'sunset'
    setCurrentTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (themeId) => {
    const theme = themes.find(t => t.id === themeId)
    if (!theme) return

    // Update CSS variables to match your existing system
    document.documentElement.style.setProperty('--primary', theme.primary)
    document.documentElement.style.setProperty('--primary-dark', theme.primaryDark)
    document.documentElement.style.setProperty('--accent', theme.accent)
    
    // Also update gradient background for body
    const gradients = {
      sunset: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      fresh: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
      ocean: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      royal: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
      candy: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)'
    }
    
    document.body.style.background = gradients[themeId] || gradients.sunset
    
    // Add class to body for theme-specific styles
    document.body.className = document.body.className.replace(/theme-\w+/, '').trim()
    document.body.classList.add(`theme-${themeId}`)
    
    localStorage.setItem('theme', themeId)
  }

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId)
    applyTheme(themeId)
    setIsOpen(false)
    
    // Optional: Show success message
    const theme = themes.find(t => t.id === themeId)
    if (window.toast) {
      window.toast.success(`${theme?.name} theme applied! 🎨`)
    }
  }

  const currentThemeData = themes.find(t => t.id === currentTheme)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 mb-2 bg-white rounded-2xl shadow-2xl p-2 border border-gray-200 min-w-[160px]"
          >
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => changeTheme(theme.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                  currentTheme === theme.id
                    ? 'text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                style={currentTheme === theme.id ? {
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`
                } : {}}
              >
                <span className="text-xl">{theme.icon}</span>
                <span className="text-sm font-medium">{theme.name}</span>
                {currentTheme === theme.id && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto text-white"
                  >
                    ✓
                  </motion.span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${currentThemeData?.primary} 0%, ${currentThemeData?.primaryDark} 100%)`
        }}
      >
        <span className="text-xl">🎨</span>
      </motion.button>
    </div>
  )
}

export default ThemeToggle