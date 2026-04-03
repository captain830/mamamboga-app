import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiStar, FiTruck, FiShield, FiArrowLeft } from 'react-icons/fi';
import { addToCart } from '../redux/slices/cartSlice';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token,
  });

  const handleAddToCart = () => {
    if (product && product.stock >= quantity) {
      dispatch(addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        image: product.image_url,
      }));
      toast.success(`${quantity} x ${product.name} added to cart!`);
    } else {
      toast.error('Insufficient stock!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">Product not found</h2>
        <button onClick={() => navigate('/products')} className="btn-primary mt-4">
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 mb-6"
      >
        <FiArrowLeft />
        <span>Back</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-96 object-cover"
            />
          ) : (
            <div className="w-full h-96 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <span className="text-6xl">🥬</span>
            </div>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              {product.category}
            </span>
            {product.featured && (
              <span className="px-2 py-1 bg-accent-100 text-accent-700 rounded-full text-sm">
                Featured
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex items-center space-x-2">
            <div className="flex items-center text-accent-500">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={i < Math.floor(product.avg_rating) ? 'fill-current' : ''}
                />
              ))}
            </div>
            <span className="text-gray-500">({product.review_count || 0} reviews)</span>
          </div>

          <p className="text-gray-600">{product.description}</p>

          <div className="border-t border-b py-4">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-primary-600">
                KSh {product.price.toLocaleString()}
              </span>
              {product.discount_percentage > 0 && (
                <span className="text-gray-500 line-through">
                  KSh {((product.price * 100) / (100 - product.discount_percentage)).toFixed(0)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {product.stock > 0 ? `In stock: ${product.stock} items` : 'Out of stock'}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-4 py-2 border-x">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-3 py-2 hover:bg-gray-100"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiShoppingCart className="inline mr-2" />
              Add to Cart
            </button>
          </div>

          <div className="space-y-2 pt-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <FiTruck />
              <span>Free delivery on orders over KSh 1000</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <FiShield />
              <span>Fresh produce guaranteed</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reviews Section */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{review.user_name}</span>
                    <div className="flex text-accent-500">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className={i < review.rating ? 'fill-current' : ''} />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600">{review.comment}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;