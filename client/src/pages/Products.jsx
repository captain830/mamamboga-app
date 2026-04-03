import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { motion } from 'framer-motion'
import { FiSearch, FiFilter, FiPlus, FiShoppingCart, FiEdit2, FiTrash2, FiX } from 'react-icons/fi'
import { addToCart } from '../redux/slices/cartSlice'
import toast from 'react-hot-toast'
import VoiceSearch from '../components/VoiceSearch'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const Products = () => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Vegetables',
    price: '',
    stock: '',
    description: ''
  })
  
  const { token, user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search, category],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/products`, {
        params: { search, category },
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    enabled: !!token
  })

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData) => {
      const response = await axios.post(`${API_URL}/products`, productData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      toast.success('Product added successfully!')
      setShowModal(false)
      resetForm()
    },
    onError: (error) => {
      console.error('Add product error:', error)
      toast.error(error.response?.data?.message || 'Failed to add product')
    }
  })

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axios.put(`${API_URL}/products/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      toast.success('Product updated successfully!')
      setShowModal(false)
      resetForm()
      setEditingProduct(null)
    },
    onError: (error) => {
      console.error('Update product error:', error)
      toast.error(error.response?.data?.message || 'Failed to update product')
    }
  })

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => {
      await axios.delete(`${API_URL}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return productId
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      toast.success('Product deleted successfully!')
    },
    onError: (error) => {
      console.error('Delete product error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete product')
    }
  })

  const handleAddToCart = (product) => {
    if (product.stock > 0) {
      dispatch(addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image_url
      }))
      toast.success(`${product.name} added to cart!`)
    } else {
      toast.error('Product out of stock!')
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      description: product.description || ''
    })
    setShowModal(true)
  }

  const handleDeleteProduct = (productId, productName) => {
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
      deleteProductMutation.mutate(productId)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        data: formData
      })
    } else {
      addProductMutation.mutate(formData)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Vegetables',
      price: '',
      stock: '',
      description: ''
    })
    setEditingProduct(null)
  }

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'Vegetables', label: 'Vegetables' },
    { value: 'Cereals', label: 'Cereals' },
    { value: 'Fruits', label: 'Fruits' }
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fresh Products</h1>
          <p className="text-gray-500 text-sm mt-1">Browse our selection of fresh, organic produce</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <FiPlus />
            Add Product
          </button>
        )}
      </div>

      {/* Search and Filter with Voice Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        {/* Voice Search Button */}
        <VoiceSearch onSearchResult={(query) => {
          setSearch(query)
          toast.success(`🔍 Searching for: "${query}"`)
        }} />
        
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products && products.length > 0 ? (
          products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow hover:shadow-md transition-all overflow-hidden"
            >
              <div className="relative h-32 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                <span className="text-4xl">🥬</span>
                {product.featured && (
                  <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Featured
                  </span>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">KSh {product.price}</span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${
                        product.stock > 0
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <FiShoppingCart className="w-3 h-3" />
                      Add
                    </button>
                    {user?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Fresh Tomatoes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Vegetables">Vegetables</option>
                  <option value="Cereals">Cereals</option>
                  <option value="Fruits">Fruits</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (KSh)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Product description..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={addProductMutation.isLoading || updateProductMutation.isLoading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {addProductMutation.isLoading || updateProductMutation.isLoading
                    ? 'Saving...'
                    : editingProduct
                    ? 'Update Product'
                    : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products