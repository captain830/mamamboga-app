import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const VoiceSearch = ({ onSearchResult }) => {
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = 'en-KE'
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        console.log('🎤 Voice input:', transcript)
        onSearchResult(transcript)
        setIsListening(false)
      }
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
      
      recognitionInstance.onend = () => {
        setIsListening(false)
      }
      
      setRecognition(recognitionInstance)
    } else {
      setIsSupported(false)
    }
  }, [onSearchResult])

  const toggleListening = () => {
    if (!recognition) {
      alert('Voice search is not supported in your browser. Try Chrome!')
      return
    }
    
    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleListening}
      className={`relative p-3 rounded-full transition-all duration-300 ${
        isListening 
          ? 'bg-red-500 text-white animate-pulse shadow-lg' 
          : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
      }`}
    >
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full bg-red-400 opacity-50"
          />
        )}
      </AnimatePresence>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </motion.button>
  )
}

export default VoiceSearch