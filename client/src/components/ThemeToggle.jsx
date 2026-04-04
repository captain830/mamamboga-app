import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ThemeToggle = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('fresh')

  const themes = [
    { id: 'fresh', name: 'Fresh Green', icon: '🥬', primary: '#2e7d32', primaryDark: '#1b5e20', textColor: '#ffffff' },
    { id: 'sunset', name: 'Sunset', icon: '🌅', primary: '#ea580c', primaryDark: '#c2410c', textColor: '#ffffff' },
    { id: 'ocean', name: 'Ocean Blue', icon: '🌊', primary: '#2563eb', primaryDark: '#1d4ed8', textColor: '#ffffff' },
    { id: 'royal', name: 'Royal Purple', icon: '👑', primary: '#9333ea', primaryDark: '#7e22ce', textColor: '#ffffff' },
    { id: 'candy', name: 'Candy Pink', icon: '🍬', primary: '#db2777', primaryDark: '#be185d', textColor: '#ffffff' }
  ]

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'fresh'
    const savedMode = localStorage.getItem('darkMode') || 'light'
    setCurrentTheme(savedTheme)
    applyTheme(savedTheme)
    applyDarkMode(savedMode === 'dark')
  }, [])

  const applyTheme = (themeId) => {
    const theme = themes.find(t => t.id === themeId)
    if (!theme) return

    document.documentElement.style.setProperty('--primary', theme.primary)
    document.documentElement.style.setProperty('--primary-dark', theme.primaryDark)
    
    localStorage.setItem('theme', themeId)
  }

  const applyDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'light')
    }
  }

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.contains('dark')
    applyDarkMode(!isDark)
    toast.success(isDark ? 'Light mode activated! ☀️' : 'Dark mode activated! 🌙')
  }

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId)
    applyTheme(themeId)
    setIsOpen(false)
    const theme = themes.find(t => t.id === themeId)
    toast.success(`${theme?.name} theme applied! 🎨`)
  }

  const currentThemeData = themes.find(t => t.id === currentTheme)
  const isDarkMode = document.documentElement.classList.contains('dark')

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex gap-2">
        {/* Dark/Light Mode Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDarkMode}
          className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </motion.button>

        {/* Theme Color Picker */}
        <div className="relative">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="absolute bottom-12 right-0 mb-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-2 border border-gray-200 dark:border-gray-700 min-w-[160px]"
              >
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => changeTheme(theme.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                      currentTheme === theme.id
                        ? 'text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
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
            className="w-10 h-10 rounded-full text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${currentThemeData?.primary} 0%, ${currentThemeData?.primaryDark} 100%)`
            }}
          >
            <span className="text-lg">🎨</span>
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default ThemeToggle