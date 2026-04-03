import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const ProductModal = ({ product, onClose, onSuccess }) => {
  const { token } = useSelector((state) => state.auth)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Vegetables',
    price: '',
    stock: '',
    description: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        description: product.description || '',
      })
    }
  }, [product])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (product) {
        await axios.put(`${API_URL}/products/${product.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success('Product updated successfully')
      } else {
        await axios.post(`${API_URL}/products`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success('Product added successfully')
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Failed to save product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g., Fresh Tomatoes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Cereals">Cereals</option>
                <option value="Fruits">Fruits</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price (KSh)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input-field"
                placeholder="e.g., 100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="input-field"
                placeholder="e.g., 50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                placeholder="Product description..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary py-2 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ProductModal