import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const OfflineHandler = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [pendingOrders, setPendingOrders] = useState([])

  useEffect(() => {
    // Load pending orders from localStorage
    const savedOrders = localStorage.getItem('pendingOrders')
    if (savedOrders) {
      setPendingOrders(JSON.parse(savedOrders))
    }

    const handleOnline = () => {
      setIsOffline(false)
      toast.success('🎉 Back online! Syncing pending orders...')
      syncPendingOrders()
    }

    const handleOffline = () => {
      setIsOffline(true)
      toast.error('📡 You are offline. Orders will be saved locally.', {
        duration: 5000,
        icon: '⚠️'
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncPendingOrders = async () => {
    const token = localStorage.getItem('token')
    if (!token || pendingOrders.length === 0) return

    let synced = 0
    for (const order of pendingOrders) {
      try {
        const response = await fetch('http://localhost:5001/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(order)
        })
        
        if (response.ok) {
          synced++
        }
      } catch (error) {
        console.error('Sync failed:', error)
      }
    }

    if (synced > 0) {
      toast.success(`✅ Synced ${synced} pending order${synced > 1 ? 's' : ''}!`)
      localStorage.removeItem('pendingOrders')
      setPendingOrders([])
    }
  }

  const saveOrderForLater = (orderData) => {
    const pending = [...pendingOrders, { ...orderData, timestamp: Date.now() }]
    setPendingOrders(pending)
    localStorage.setItem('pendingOrders', JSON.stringify(pending))
    toast.success('📦 Order saved locally. Will sync when online.', {
      duration: 4000,
      icon: '💾'
    })
  }

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📡</span>
              <div>
                <p className="font-semibold">You are offline</p>
                <p className="text-sm opacity-90">
                  {pendingOrders.length > 0 
                    ? `${pendingOrders.length} order${pendingOrders.length > 1 ? 's' : ''} pending sync`
                    : 'Orders will be saved locally'}
                </p>
              </div>
            </div>
            {pendingOrders.length > 0 && (
              <button
                onClick={() => window.dispatchEvent(new Event('online'))}
                className="bg-white/20 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-white/30 transition"
              >
                Retry Sync
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineHandler