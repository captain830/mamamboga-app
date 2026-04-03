import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Orders = () => {
  const { token, user } = useSelector((state) => state.auth)
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      const endpoint = user?.role === 'admin' ? '/orders/all' : '/orders/my-orders'
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: statusFilter !== 'all' ? { status: statusFilter } : {},
      })
      return response.data
    },
    enabled: !!token,
  })

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`Order status updated to ${newStatus}`)
      refetch()
    } catch (error) {
      toast.error('Failed to update order status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-purple-100 text-purple-800'
      case 'confirmed': return 'bg-indigo-100 text-indigo-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const statuses = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const ordersList = orders?.orders || orders || []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Track and manage your orders</p>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => setStatusFilter(status.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              statusFilter === status.value
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {ordersList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <p className="text-gray-500">No orders found</p>
          <Link to="/products" className="btn-primary inline-block mt-4">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ordersList.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex flex-wrap justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.order_number || order.id}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Placed on {new Date(order.created_at).toLocaleString()}
                    </p>
                    {order.customer_name && (
                      <p className="text-sm text-gray-600 mt-1">
                        Customer: {order.customer_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      KSh {order.total_amount?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.delivery_type === 'delivery' ? '🚚 Home Delivery' : '🏪 Store Pickup'}
                    </p>
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div className="border-t pt-3 mb-3">
                    <p className="text-sm text-gray-600">
                      {order.items.length} item(s):{' '}
                      {order.items.slice(0, 3).map(i => i.product_name).join(', ')}
                      {order.items.length > 3 && '...'}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center mt-3">
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                  
                  {user?.role === 'admin' && (
                    <div className="flex gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="text-sm border rounded-lg px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirm</option>
                        <option value="processing">Process</option>
                        <option value="shipped">Ship</option>
                        <option value="delivered">Deliver</option>
                        <option value="cancelled">Cancel</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders