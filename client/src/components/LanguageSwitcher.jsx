import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe } from 'lucide-react'

const LanguageSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState('en')
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧', label: 'English' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪', label: 'Kiswahili' }
  ]
  
  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en'
    setCurrentLang(savedLang)
    document.documentElement.lang = savedLang
  }, [])
  
  const changeLanguage = (langCode) => {
    setCurrentLang(langCode)
    localStorage.setItem('language', langCode)
    document.documentElement.lang = langCode
    setIsOpen(false)
    window.location.reload() // Refresh to apply translations
  }
  
  const currentLanguage = languages.find(l => l.code === currentLang)
  
  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition"
      >
        <Globe size={18} />
        <span>{currentLanguage?.flag} {currentLanguage?.name}</span>
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border overflow-hidden z-50"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition ${
                  currentLang === lang.code ? 'bg-green-50 text-green-600' : 'text-gray-700'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span>{lang.name}</span>
                {currentLang === lang.code && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LanguageSwitcher