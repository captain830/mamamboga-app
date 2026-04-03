import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiMapPin, FiTruck, FiClock, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import WhatsAppShare from '../components/WhatsAppShare'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [cancelling, setCancelling] = useState(false);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token,
  });

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    setCancelling(true);
    try {
      await axios.post(`${API_URL}/orders/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Order cancelled successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">Order not found</h2>
        <button onClick={() => navigate('/orders')} className="btn-primary mt-4">
          Back to Orders
        </button>
      </div>
    );
  }

  const canCancel = order.status === 'pending' || order.status === 'confirmed';

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 mb-6"
      >
        <FiArrowLeft />
        <span>Back to Orders</span>
      </button>

      <div className="space-y-6">
        {/* Order Header */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-wrap justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
              <p className="text-gray-500 mt-1">
                Placed on {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {order.status.toUpperCase()}
              </span>
              {canCancel && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="block mt-2 text-red-600 hover:text-red-700 text-sm"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items?.map((item, index) => (
  <div key={item.id || index} className="flex items-center justify-between border-b pb-4">
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center">
        <span className="text-2xl">🥬</span>
      </div>
      <div>
        <h3 className="font-semibold">{item.product_name}</h3>
        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-bold text-primary-600">KSh {item.price}</p>
      <p className="text-sm text-gray-500">Total: KSh {item.price * item.quantity}</p>
    </div>
  </div>
))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>KSh {order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span>KSh {order.delivery_fee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (16%)</span>
                <span>KSh {order.tax}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">KSh {order.total_amount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Information</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <FiMapPin className="text-gray-400 mt-1" />
              <div>
                <p className="font-medium">Delivery Type</p>
                <p className="text-gray-600">
                  {order.delivery_type === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
                </p>
              </div>
            </div>
            {order.delivery_address && (
              <div className="flex items-start space-x-3">
                <FiTruck className="text-gray-400 mt-1" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-gray-600">{order.delivery_address}</p>
                </div>
              </div>
            )}
            {order.delivery_instructions && (
              <div className="flex items-start space-x-3">
                <FiClock className="text-gray-400 mt-1" />
                <div>
                  <p className="font-medium">Special Instructions</p>
                  <p className="text-gray-600">{order.delivery_instructions}</p>
                </div>
              </div>
            )}
          </div>
        </div>
            <WhatsAppShare order={order} />

      {/* Order Timeline */}
<div className="bg-white rounded-xl shadow-md p-6">
  <h2 className="text-xl font-bold text-gray-900 mb-4">Order Timeline</h2>
  <div className="space-y-4">
    <div key="placed" className="flex items-start space-x-3">
      <FiCheckCircle className="text-green-500 mt-1" />
      <div>
        <p className="font-medium">Order Placed</p>
        <p className="text-sm text-gray-500">
          {new Date(order.created_at).toLocaleString()}
        </p>
      </div>
    </div>
    {order.status === 'confirmed' && (
      <div key="confirmed" className="flex items-start space-x-3">
        <FiCheckCircle className="text-blue-500 mt-1" />
        <div>
          <p className="font-medium">Order Confirmed</p>
          <p className="text-sm text-gray-500">
            {new Date(order.updated_at).toLocaleString()}
          </p>
        </div>
      </div>
    )}
    {order.status === 'shipped' && (
      <div key="shipped" className="flex items-start space-x-3">
        <FiTruck className="text-blue-500 mt-1" />
        <div>
          <p className="font-medium">Order Shipped</p>
          <p className="text-sm text-gray-500">
            {new Date(order.updated_at).toLocaleString()}
          </p>
        </div>
      </div>
    )}
    {order.status === 'delivered' && (
      <div key="delivered" className="flex items-start space-x-3">
        <FiCheckCircle className="text-green-500 mt-1" />
        <div>
          <p className="font-medium">Delivered</p>
          <p className="text-sm text-gray-500">
            {new Date(order.updated_at).toLocaleString()}
          </p>
        </div>
      </div>
    )}
  </div>
</div>
      </div>
    </div>
  );
};

export default OrderDetails;