import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Share2, Check, X } from 'lucide-react'

const WhatsAppShare = ({ order }) => {
  const [showPopup, setShowPopup] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!order) return null

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(
      `🛒 *Mama Mboga Order #${order.order_number}*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *Order Details:*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔢 Order Number: #${order.order_number}\n` +
      `📅 Date: ${new Date(order.created_at).toLocaleString()}\n` +
      `📊 Status: ${order.status.toUpperCase()}\n` +
      `💰 Total: KSh ${order.total_amount}\n` +
      `🚚 Delivery: ${order.delivery_type === 'delivery' ? 'Home Delivery' : 'Store Pickup'}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🛍️ *Items:*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `${order.items?.map(item => 
        `• ${item.product_name} x ${item.quantity} = KSh ${item.price * item.quantity}`
      ).join('\n')}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔗 Track your order: http://localhost:5173/orders/${order.id}\n\n` +
      `Thank you for shopping with Mama Mboga! 🥬\n` +
      `━━━━━━━━━━━━━━━━━━━━━━`
    )
    
    window.open(`https://wa.me/?text=${message}`, '_blank')
    setShowPopup(false)
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Order #${order.order_number} from Mama Mboga`)
    const body = encodeURIComponent(
      `Order #${order.order_number}\n` +
      `Status: ${order.status}\n` +
      `Total: KSh ${order.total_amount}\n` +
      `Track: http://localhost:5173/orders/${order.id}`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    setShowPopup(false)
  }

  const copyLink = () => {
    const link = `http://localhost:5173/orders/${order.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: `Order #${order.order_number}`,
        text: `My order from Mama Mboga is ${order.status}`,
        url: `http://localhost:5173/orders/${order.id}`
      }).catch(() => {})
    } else {
      setShowPopup(true)
    }
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={shareNative}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
      >
        <MessageCircle size={20} />
        <span>Share Order on WhatsApp</span>
      </motion.button>

      {/* Share Popup Modal */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Share Order</h3>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={shareOnWhatsApp}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
                >
                  <MessageCircle size={20} />
                  <span>Share on WhatsApp</span>
                </button>

                <button
                  onClick={shareViaEmail}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Share via Email</span>
                </button>

                <button
                  onClick={copyLink}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition"
                >
                  {copied ? <Check size={20} /> : <Share2 size={20} />}
                  <span>{copied ? 'Copied!' : 'Copy Order Link'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default WhatsAppShare