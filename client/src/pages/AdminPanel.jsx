import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { motion } from 'framer-motion'
import { FiUsers, FiPackage, FiShoppingCart, FiDollarSign, FiRefreshCw, FiPlus, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const AdminPanel = () => {
  const { token, user } = useSelector((state) => state.auth)
  const [stats, setStats] = useState({
    totalUsers: 1,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  })
  const [selectedTab, setSelectedTab] = useState('overview')

  // Fetch all orders from your server
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_URL}/orders/all`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        return response.data
      } catch (error) {
        console.error('Error fetching orders:', error)
        return []
      }
    },
    enabled: !!token && user?.role === 'admin'
  })

  // Fetch all products from your server
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        return response.data
      } catch (error) {
        console.error('Error fetching products:', error)
        return []
      }
    },
    enabled: !!token && user?.role === 'admin'
  })

  // Calculate stats from fetched data
  useEffect(() => {
    if (orders && products) {
      setStats({
        totalUsers: orders.length > 0 ? [...new Set(orders.map(o => o.user_id))].length : 1,
        totalProducts: products.length || 0,
        totalOrders: orders.length || 0,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        pendingOrders: orders.filter(o => o.status === 'pending').length || 0
      })
    }
  }, [orders, products])

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`Order status updated to ${newStatus}`)
      refetchOrders()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order status')
    }
  }

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await axios.delete(`${API_URL}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Product deleted successfully')
      refetchProducts()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  const statsCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: 'bg-blue-500' },
    { title: 'Total Products', value: stats.totalProducts, icon: FiPackage, color: 'bg-green-500' },
    { title: 'Total Orders', value: stats.totalOrders, icon: FiShoppingCart, color: 'bg-purple-500' },
    { title: 'Total Revenue', value: `KSh ${stats.totalRevenue.toLocaleString()}`, icon: FiDollarSign, color: 'bg-orange-500' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: FiRefreshCw, color: 'bg-yellow-500' }
  ]

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">You don't have permission to view this page</p>
      </div>
    )
  }

  if (ordersLoading || productsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your Mama Mboga store</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-4 py-2 rounded-lg transition ${selectedTab === 'overview' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('orders')}
            className={`px-4 py-2 rounded-lg transition ${selectedTab === 'orders' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Orders
          </button>
          <button
            onClick={() => setSelectedTab('products')}
            className={`px-4 py-2 rounded-lg transition ${selectedTab === 'products' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Products
          </button>
        </div>
      </div>

      {/* Stats Cards - Always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide">{stat.title}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/products" className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                <span>Add New Product</span>
                <FiPlus className="text-green-600" />
              </Link>
              <Link to="/orders" className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                <span>Manage All Orders</span>
                <FiEye className="text-blue-600" />
              </Link>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                Export Reports
              </button>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
            {orders && orders.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Order #{order.order_number}</p>
                      <p className="text-xs text-gray-500">{order.customer_name || 'Customer'}</p>
                      <p className="text-xs font-semibold text-green-600">KSh {order.total_amount}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1 bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirm</option>
                        <option value="processing">Process</option>
                        <option value="shipped">Ship</option>
                        <option value="delivered">Deliver</option>
                        <option value="cancelled">Cancel</option>
                      </select>
                      <Link to={`/orders/${order.id}`} className="text-blue-600 hover:text-blue-800">
                        <FiEye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            )}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {selectedTab === 'orders' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">All Orders</h2>
          </div>
          {orders && orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Order ID</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">#{order.order_number}</td>
                      <td className="py-3 px-4 text-sm">{order.customer_name || 'Guest'}</td>
                      <td className="py-3 px-4 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm font-medium text-green-600">KSh {order.total_amount}</td>
                      <td className="py-3 px-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1 bg-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/orders/${order.id}`} className="text-blue-600 hover:text-blue-800">
                          <FiEye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No orders found</p>
          )}
        </div>
      )}

      {/* Products Tab */}
      {selectedTab === 'products' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-5 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Product Inventory</h2>
            <Link to="/products" className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700">
              + Add Product
            </Link>
          </div>
          {products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Product</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Category</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Price</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Stock</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{product.name}</td>
                      <td className="py-3 px-4 text-sm">{product.category}</td>
                      <td className="py-3 px-4 text-sm font-medium text-green-600">KSh {product.price}</td>
                      <td className="py-3 px-4 text-sm">{product.stock}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          product.stock > 10 ? 'bg-green-100 text-green-800' : 
                          product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link to={`/products/${product.id}`} className="text-blue-600 hover:text-blue-800">
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-800">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No products found</p>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminPanel