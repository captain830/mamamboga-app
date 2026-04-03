import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiTruck, FiMapPin, FiCreditCard } from 'react-icons/fi'
import { removeFromCart, updateQuantity, clearCart } from '../redux/slices/cartSlice'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Cart = () => {
  const { items, totalAmount, totalItems } = useSelector((state) => state.cart)
  const { token, user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [deliveryType, setDeliveryType] = useState('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '')
  const [currentOrder, setCurrentOrder] = useState(null)

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    if (deliveryType === 'delivery' && !deliveryAddress) {
      toast.error('Please enter delivery address')
      return
    }

    setIsProcessing(true)
    try {
      const orderData = {
        items: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        total_amount: totalAmount + (deliveryType === 'delivery' ? 100 : 0),
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? deliveryAddress : null,
      }

      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setCurrentOrder(response.data.order)
      setShowPaymentModal(true)
      toast.success('Order created! Please complete payment')
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error.response?.data?.message || 'Failed to create order')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMpesaPayment = async () => {
    if (!phoneNumber) {
      toast.error('Please enter your M-Pesa phone number')
      return
    }

    setIsProcessing(true)
    try {
      const response = await axios.post(`${API_URL}/payments/mpesa/stkpush`, {
        orderId: currentOrder.id,
        phone: phoneNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Payment initiated! Check your phone to complete payment')
      setShowPaymentModal(false)
      dispatch(clearCart())
      navigate('/orders')
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FiShoppingBag className="w-20 h-20 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added any items yet</p>
        <button onClick={() => navigate('/products')} className="btn-primary">
          Start Shopping
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
      <p className="text-gray-600 mb-4">{totalItems} item(s) in your cart</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🥬</span>
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                <p className="text-green-600 font-bold">KSh {item.price}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }))}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <FiMinus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <FiPlus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right min-w-[80px]">
                <p className="font-bold text-gray-900">KSh {(item.price * item.quantity).toLocaleString()}</p>
                <button
                  onClick={() => dispatch(removeFromCart(item.productId))}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  <FiTrash2 className="inline w-3 h-3" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">KSh {totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-semibold">{deliveryType === 'delivery' ? 'KSh 100' : 'KSh 0'}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-xl font-bold text-green-600">
                    KSh {(totalAmount + (deliveryType === 'delivery' ? 100 : 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="pickup"
                  checked={deliveryType === 'pickup'}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="text-green-600"
                />
                <FiTruck />
                <span className="flex-1">Pickup from store</span>
                <span className="text-sm text-gray-500">Free</span>
              </label>
              
              <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="delivery"
                  checked={deliveryType === 'delivery'}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="text-green-600"
                />
                <FiMapPin />
                <span className="flex-1">Home Delivery</span>
                <span className="text-sm text-gray-500">+KSh 100</span>
              </label>
              
              {deliveryType === 'delivery' && (
                <textarea
                  placeholder="Enter your delivery address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows="2"
                  required
                />
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold"
            >
              {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">✨ Why Shop With Us?</h4>
            <ul className="space-y-1 text-sm text-green-700">
              <li>✓ Fresh produce directly from farmers</li>
              <li>✓ Fast delivery within 2 hours</li>
              <li>✓ Secure M-Pesa payments</li>
              <li>✓ Money-back guarantee</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Payment</h2>
            <p className="text-gray-600 mb-4">Order #{currentOrder?.order_number}</p>
            <p className="text-2xl font-bold text-green-600 mb-4">KSh {currentOrder?.total_amount?.toLocaleString()}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">M-Pesa Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0712345678"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">You will receive a prompt on your phone</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleMpesaPayment}
                disabled={isProcessing}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
              >
                <FiCreditCard className="inline mr-2" />
                Pay with M-Pesa
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart