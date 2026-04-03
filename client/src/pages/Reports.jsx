// client/src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import ExportReport from '../components/ExportReport';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, Users, DollarSign, Package, Star } from 'lucide-react';

const Reports = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    recentOrders: [],
    salesByDay: []
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch orders
      const ordersRes = await api.get('/orders/all');
      const orders = ordersRes.data || [];
      
      // Fetch products
      const productsRes = await api.get('/products');
      const products = productsRes.data || [];
      
      // Fetch users (from memory/db)
      const usersRes = await api.get('/auth/me');
      
      // Calculate statistics
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const completedOrders = orders.filter(o => o.status === 'delivered').length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
      
      // Get unique users from orders
      const uniqueUsers = [...new Set(orders.map(o => o.user_id))];
      
      // Calculate top products
      const productSales = {};
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const productName = item.product_name || `Product ${item.product_id}`;
            if (!productSales[productName]) {
              productSales[productName] = { quantity: 0, revenue: 0 };
            }
            productSales[productName].quantity += item.quantity || 0;
            productSales[productName].revenue += (item.price || 0) * (item.quantity || 0);
          });
        }
      });
      
      const topProducts = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      // Calculate sales by day (last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();
      
      const salesByDay = last7Days.map(date => {
        const dayOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at).toISOString().split('T')[0];
          return orderDate === date;
        });
        return {
          date,
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
        };
      });
      
      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalUsers: uniqueUsers.length,
        pendingOrders,
        completedOrders,
        averageOrderValue: Math.round(averageOrderValue),
        topProducts,
        recentOrders: orders.slice(0, 5),
        salesByDay
      });
      
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 inline-block p-4 rounded-full mb-4">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Revenue', value: `KSh ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-500' },
    { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-blue-500' },
    { title: 'Total Products', value: stats.totalProducts, icon: Package, color: 'bg-purple-500' },
    { title: 'Total Customers', value: stats.totalUsers, icon: Users, color: 'bg-orange-500' },
    { title: 'Completed Orders', value: stats.completedOrders, icon: TrendingUp, color: 'bg-emerald-500' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: Star, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">View sales performance and business insights</p>
        </div>
        <ExportReport 
          data={stats.salesByDay} 
          type="sales" 
          filename="sales_report" 
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500 hover:shadow-xl transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{card.title}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-2 rounded-lg`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sales by Day Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">📈 Daily Sales (Last 7 Days)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.salesByDay.map((day) => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(day.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600">{day.orders}</td>
                  <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">KSh {day.revenue.toLocaleString()}</td>
                 </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">Total</td>
                <td className="px-6 py-4 text-sm font-bold text-right">{stats.salesByDay.reduce((sum, d) => sum + d.orders, 0)}</td>
                <td className="px-6 py-4 text-sm font-bold text-right text-green-600">
                  KSh {stats.salesByDay.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Two Column Layout for Top Products and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">🏆 Top Selling Products</h2>
          </div>
          <div className="p-4 space-y-3">
            {stats.topProducts.length > 0 ? (
              stats.topProducts.map((product, idx) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📦'}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">KSh {product.revenue.toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No products sold yet</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">📋 Recent Orders</h2>
          </div>
          <div className="p-4 space-y-3">
            {stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">#{order.order_number}</p>
                    <p className="text-xs text-gray-500">
                      {order.customer_name} • {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">KSh {order.total_amount}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-bold">Business Summary</h3>
            <p className="text-green-100 mt-1">Performance overview</p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.averageOrderValue.toLocaleString()}</p>
              <p className="text-sm text-green-100">Avg Order Value (KSh)</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{((stats.completedOrders / stats.totalOrders) * 100 || 0).toFixed(0)}%</p>
              <p className="text-sm text-green-100">Completion Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;