import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        processing: 'bg-purple-100 text-purple-800',
        shipped: 'bg-indigo-100 text-indigo-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
    };

    useEffect(() => {
        fetchOrders();
    }, [filter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/orders/all');
            let ordersData = response.data;
            if (filter !== 'all') {
                ordersData = ordersData.filter(o => o.status === filter);
            }
            setOrders(ordersData);
        } catch (error) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order status updated to ${newStatus}`);
            fetchOrders();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-2">📦 Order Management</h1>
            <p className="text-gray-600 mb-6">Manage customer orders and update statuses</p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow border-l-4 border-gray-500">
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-gray-500">Total Orders</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow border-l-4 border-yellow-500">
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-sm text-gray-500">Pending</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow border-l-4 border-blue-500">
                    <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
                    <p className="text-sm text-gray-500">Confirmed</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow border-l-4 border-indigo-500">
                    <p className="text-2xl font-bold text-indigo-600">{stats.shipped}</p>
                    <p className="text-sm text-gray-500">Shipped</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow border-l-4 border-green-500">
                    <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                    <p className="text-sm text-gray-500">Delivered</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {['all', ...statuses].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                            filter === s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            {loading ? (
                <div className="text-center py-12">Loading orders...</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                    <div className="text-5xl mb-2">📦</div>
                    <p className="text-gray-500">No orders found</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.order_number || order.id}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                                                <p className="text-xs text-gray-500">{order.customer_phone}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-green-600">KSh {order.total_amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                                className="px-3 py-1 border rounded-lg text-sm bg-white"
                                            >
                                                {statuses.map(s => (
                                                    <option key={s} value={s}>{s.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;