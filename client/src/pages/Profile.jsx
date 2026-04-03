import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoyaltyCard from '../components/LoyaltyCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Profile = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [totalSpent, setTotalSpent] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  // Fetch orders to calculate total spent and order count
  const { data: orders } = useQuery({
    queryKey: ['userOrders'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (orders && orders.length > 0) {
      const total = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      setTotalSpent(total);
      setOrderCount(orders.length);
    }
  }, [orders]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleUpdate = async () => {
    try {
      const response = await axios.put(`${API_URL}/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
      // Update user in localStorage
      const updatedUser = { ...user, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <FiUser className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
              <p className="text-green-100 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 text-green-600 hover:text-green-700"
              >
                <FiEdit2 />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdate}
                  className="flex items-center space-x-2 text-green-600 hover:text-green-700"
                >
                  <FiSave />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user.name,
                      phone: user.phone,
                      email: user.email,
                    });
                  }}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                >
                  <FiX />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FiUser className="text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Full Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user?.name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FiMail className="text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email Address</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user?.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FiPhone className="text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Phone Number</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user?.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Loyalty Card Component */}
          <LoyaltyCard 
            user={user}
            totalSpent={totalSpent}
            orderCount={orderCount}
          />

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;