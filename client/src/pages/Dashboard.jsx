import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Line, Doughnut } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js'
import { FiPackage, FiShoppingCart, FiTruck, FiDollarSign } from 'react-icons/fi'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Dashboard = () => {
    const { user, token } = useSelector((state) => state.auth)
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalProducts: 0,
        totalDeliveries: 0,
        totalRevenue: 0,
    })

    const { data: orders } = useQuery({
        queryKey: ['dashboardOrders'],
        queryFn: async () => {
            const response = await axios.get(`${API_URL}/orders/my-orders`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            return response.data
        },
        enabled: !!token,
    })

    const { data: products } = useQuery({
        queryKey: ['dashboardProducts'],
        queryFn: async () => {
            const response = await axios.get(`${API_URL}/products`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            return response.data
        },
        enabled: !!token,
    })

    useEffect(() => {
        if (orders && products) {
            setStats({
                totalOrders: orders.length,
                totalProducts: products.length,
                totalDeliveries: orders.filter(o => o.status === 'delivered').length,
                totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
            })
        }
    }, [orders, products])

    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Orders',
                data: [12, 19, 15, 17, 14, 20],
                borderColor: '#2e7d32',
                backgroundColor: 'rgba(46, 125, 50, 0.1)',
                tension: 0.4,
                borderWidth: 2,
            },
            {
                label: 'Revenue (KSh)',
                data: [5000, 8000, 6000, 9000, 7000, 10000],
                borderColor: '#ff9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                tension: 0.4,
                borderWidth: 2,
            },
        ],
    }

    const categoryData = {
        labels: ['Vegetables', 'Cereals', 'Fruits'],
        datasets: [
            {
                data: [65, 25, 10],
                backgroundColor: ['#2e7d32', '#ff9800', '#66bb6a'],
                borderWidth: 0,
            },
        ],
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { font: { size: 11, weight: '500' } }
            },
            tooltip: {
                bodyFont: { size: 11 }
            }
        },
    }

    const statsCards = [
        { title: 'Total Orders', value: stats.totalOrders, icon: FiShoppingCart, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
        { title: 'Products', value: stats.totalProducts, icon: FiPackage, color: 'from-green-500 to-green-600', bg: 'bg-green-50' },
        { title: 'Deliveries', value: stats.totalDeliveries, icon: FiTruck, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
        { title: 'Revenue', value: `KSh ${stats.totalRevenue.toLocaleString()}`, icon: FiDollarSign, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50' },
    ]

    if (!products) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
        )
    }

    return (
        <div>
            {/* Welcome Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">Welcome back, <span className="font-medium text-green-600">{user?.name}</span>! Here's what's happening today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statsCards.map((stat) => (
                    <div key={stat.title} className={`${stat.bg} rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                            </div>
                            <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl shadow-sm`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h2 className="text-base font-semibold text-gray-800 mb-3">Order Trends</h2>
                    <div className="h-56">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h2 className="text-base font-semibold text-gray-800 mb-3">Product Categories</h2>
                    <div className="h-56 flex items-center justify-center">
                        <Doughnut data={categoryData} options={{ responsive: true, maintainAspectRatio: true }} />
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-800">Recent Orders</h2>
                </div>
                {orders && orders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                 </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.slice(0, 5).map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3 text-sm font-medium text-gray-900">#{order.order_number || order.id}</td>
                                        <td className="px-5 py-3 text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="px-5 py-3 text-sm font-semibold text-green-600">KSh {order.total_amount}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500">No orders yet. Start shopping!</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard