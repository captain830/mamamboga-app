import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiTruck, FiMapPin, FiClock, FiCheckCircle, FiAlertCircle, 
  FiCalendar, FiPhone, FiUser, FiPackage, FiNavigation 
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Delivery = () => {
  const { token, user } = useSelector((state) => state.auth)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [deliveryOption, setDeliveryOption] = useState('standard')
  const [scheduledDate, setScheduledDate] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')

  // Fetch user's orders
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    enabled: !!token
  })

  // Get orders that are ready for delivery (confirmed or processing)
  const readyForDelivery = orders?.filter(o => 
    o.status === 'confirmed' || o.status === 'processing' || o.status === 'shipped'
  ) || []

  // Get delivered orders
  const deliveredOrders = orders?.filter(o => o.status === 'delivered') || []

  const deliveryOptions = [
    { id: 'standard', name: 'Standard Delivery', time: '2-3 hours', price: 100, icon: FiTruck },
    { id: 'express', name: 'Express Delivery', time: '30-60 minutes', price: 200, icon: FiNavigation },
    { id: 'scheduled', name: 'Scheduled Delivery', time: 'Choose time', price: 100, icon: FiCalendar }
  ]

  const requestDelivery = async () => {
    if (!selectedOrder) {
      alert('Please select an order first')
      return
    }

    try {
      // In a real app, this would call your delivery API
      // For now, just show a success message
      alert(`Delivery requested for Order #${selectedOrder.order_number}\nDelivery Type: ${deliveryOptions.find(d => d.id === deliveryOption)?.name}\nInstructions: ${deliveryInstructions || 'None'}`)
      
      // Update order status locally
      const updatedOrder = { ...selectedOrder, status: 'shipped' }
      setSelectedOrder(updatedOrder)
      
      // Refresh orders list
      refetch()
    } catch (error) {
      console.error('Delivery request error:', error)
      alert('Failed to request delivery. Please try again.')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <FiCheckCircle className="text-green-500" />
      case 'shipped': return <FiTruck className="text-blue-500" />
      case 'processing': return <FiPackage className="text-purple-500" />
      case 'confirmed': return <FiClock className="text-yellow-500" />
      default: return <FiAlertCircle className="text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-purple-100 text-purple-800'
      case 'confirmed': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
        <p className="text-gray-500 text-sm mt-1">Schedule and track your deliveries</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Orders List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Orders Ready for Delivery */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FiTruck className="text-green-600" />
              <span>Ready for Delivery</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full ml-auto">
                {readyForDelivery.length}
              </span>
            </h2>
            
            {readyForDelivery.length === 0 ? (
              <div className="text-center py-6">
                <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No orders ready for delivery</p>
                <p className="text-gray-400 text-xs mt-1">Orders will appear here once confirmed</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {readyForDelivery.map((order) => (
                  <motion.button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    whileHover={{ scale: 1.02 }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedOrder?.id === order.id
                        ? 'bg-green-50 border-2 border-green-500 shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">Order #{order.order_number}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs font-medium text-green-600 mt-1">
                          KSh {order.total_amount}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        {order.delivery_type === 'pickup' && (
                          <span className="text-xs text-gray-400 mt-1">Store Pickup</span>
                        )}
                      </div>
                    </div>
                    {order.delivery_address && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <FiMapPin className="w-3 h-3" />
                        <span className="truncate">{order.delivery_address}</span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Delivery History */}
          {deliveredOrders.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FiCheckCircle className="text-green-600" />
                <span>Delivery History</span>
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {deliveredOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">Order #{order.order_number}</p>
                        <p className="text-xs text-gray-500">
                          Delivered {new Date(order.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <FiCheckCircle className="text-green-500 w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Delivery Options & Tracking */}
        <div className="lg:col-span-2">
          {!selectedOrder ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FiTruck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">No Order Selected</h3>
              <p className="text-gray-500 text-sm mt-2">Select an order from the left panel to arrange delivery</p>
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Order Summary */}
                <div className="bg-white rounded-lg shadow p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Order Summary</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Order Number</span>
                      <span className="font-semibold">#{selectedOrder.order_number}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Order Date</span>
                      <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="font-bold text-green-600">KSh {selectedOrder.total_amount}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Items</span>
                      <span>{selectedOrder.items?.length || 0} item(s)</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Options */}
                <div className="bg-white rounded-lg shadow p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FiTruck />
                    <span>Choose Delivery Option</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {deliveryOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setDeliveryOption(option.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          deliveryOption === option.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <option.icon className={`w-6 h-6 mx-auto mb-2 ${
                          deliveryOption === option.id ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <p className="font-semibold text-sm">{option.name}</p>
                        <p className="text-xs text-gray-500">{option.time}</p>
                        <p className="text-xs font-bold text-green-600 mt-1">+KSh {option.price}</p>
                      </button>
                    ))}
                  </div>

                  {deliveryOption === 'scheduled' && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Delivery Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      rows="2"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., Call before delivery, Gate code, etc."
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                {selectedOrder.delivery_type === 'delivery' && selectedOrder.delivery_address && (
                  <div className="bg-white rounded-lg shadow p-5">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <FiMapPin />
                      <span>Delivery Address</span>
                    </h2>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">{selectedOrder.delivery_address}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={requestDelivery}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
                  >
                    <FiTruck />
                    Request Delivery
                  </button>
                  {selectedOrder.status === 'shipped' && (
                    <button className="px-6 py-3 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition">
                      Track Order
                    </button>
                  )}
                </div>

                {/* Tracking Info if already shipped */}
                {selectedOrder.status === 'shipped' && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <FiNavigation />
                      Current Status: Out for Delivery
                    </h3>
                    <div className="space-y-2 text-sm text-blue-700">
                      <div className="flex items-center gap-2">
                        <FiCheckCircle className="w-4 h-4" />
                        <span>Order picked up by driver</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiTruck className="w-4 h-4" />
                        <span>Estimated delivery: 30-45 minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiUser className="w-4 h-4" />
                        <span>Driver: David (0712345678)</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}

export default Delivery