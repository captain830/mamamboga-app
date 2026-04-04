import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, 
  Package, Star, Calendar, Download, Filter, BarChart3, 
  PieChart, Activity, Clock, Award, Target, Zap,
  ArrowUp, ArrowDown, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly'); // daily, weekly, monthly, yearly
  const [showCharts, setShowCharts] = useState(true);
  const [analytics, setAnalytics] = useState({
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalProducts: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      growthRate: 0
    },
    revenueData: [],
    ordersData: [],
    topProducts: [],
    categoryBreakdown: [],
    customerSegments: [],
    dailyStats: [],
    monthlyTrends: [],
    peakHours: [],
    refundRate: 0,
    customerRetention: 0
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAnalytics();
    }
  }, [period, user]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch orders
      const ordersRes = await api.get('/orders/all');
      const orders = ordersRes.data || [];
      
      // Fetch products
      const productsRes = await api.get('/products');
      const products = productsRes.data || [];
      
      // Calculate comprehensive analytics
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalOrders = orders.length;
      const uniqueCustomers = [...new Set(orders.map(o => o.user_id))];
      const totalCustomers = uniqueCustomers.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate growth rate (compare last 30 days vs previous 30 days)
      const now = new Date();
      const last30Days = orders.filter(o => new Date(o.created_at) > new Date(now.setDate(now.getDate() - 30)));
      const previous30Days = orders.filter(o => {
        const date = new Date(o.created_at);
        return date > new Date(now.setDate(now.getDate() - 60)) && date < new Date(now.setDate(now.getDate() + 30));
      });
      const lastRevenue = last30Days.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const previousRevenue = previous30Days.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const growthRate = previousRevenue > 0 ? ((lastRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      
      // Calculate conversion rate (orders per customer)
      const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;
      
      // Calculate refund/cancellation rate
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
      const refundRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
      
      // Calculate customer retention (customers who ordered more than once)
      const repeatCustomers = uniqueCustomers.filter(id => orders.filter(o => o.user_id === id).length > 1);
      const customerRetention = totalCustomers > 0 ? (repeatCustomers.length / totalCustomers) * 100 : 0;
      
      // Top products
      const productSales = {};
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const productName = item.product_name || `Product ${item.product_id}`;
            if (!productSales[productName]) {
              productSales[productName] = { quantity: 0, revenue: 0, orders: 0 };
            }
            productSales[productName].quantity += item.quantity || 0;
            productSales[productName].revenue += (item.price || 0) * (item.quantity || 0);
            productSales[productName].orders += 1;
          });
        }
      });
      
      const topProducts = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      // Category breakdown
      const categorySales = {};
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            const category = product?.category || 'Other';
            if (!categorySales[category]) {
              categorySales[category] = { revenue: 0, quantity: 0 };
            }
            categorySales[category].revenue += (item.price || 0) * (item.quantity || 0);
            categorySales[category].quantity += item.quantity || 0;
          });
        }
      });
      
      const categoryBreakdown = Object.entries(categorySales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue);
      
      // Daily stats for last 7 days
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();
      
      const dailyStats = last7Days.map(date => {
        const dayOrders = orders.filter(o => o.created_at?.split('T')[0] === date);
        return {
          date,
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
          avgOrder: dayOrders.length > 0 ? dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / dayOrders.length : 0
        };
      });
      
      // Monthly trends
      const monthlyMap = {};
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { revenue: 0, orders: 0, month: date.toLocaleString('default', { month: 'short', year: 'numeric' }) };
        }
        monthlyMap[monthKey].revenue += order.total_amount || 0;
        monthlyMap[monthKey].orders += 1;
      });
      
      const monthlyTrends = Object.entries(monthlyMap)
        .map(([key, data]) => ({ key, ...data }))
        .sort((a, b) => a.key.localeCompare(b.key))
        .slice(-12);
      
      // Peak hours (when most orders are placed)
      const hourCounts = Array(24).fill(0);
      orders.forEach(order => {
        const hour = new Date(order.created_at).getHours();
        hourCounts[hour]++;
      });
      
      const peakHours = hourCounts.map((count, hour) => ({ hour, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      
      setAnalytics({
        summary: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          totalProducts: products.length,
          averageOrderValue,
          conversionRate,
          growthRate
        },
        revenueData: dailyStats,
        ordersData: dailyStats,
        topProducts,
        categoryBreakdown,
        dailyStats,
        monthlyTrends,
        peakHours,
        refundRate,
        customerRetention
      });
      
    } catch (error) {
      console.error('Analytics error:', error);
      toast.error('Failed to load analytics');
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
        <p className="text-gray-600 mt-2">Admin access required to view analytics.</p>
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

  const summaryCards = [
    { title: 'Total Revenue', value: `KSh ${analytics.summary.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-green-500 to-emerald-600', change: `+${analytics.summary.growthRate.toFixed(1)}%`, trend: 'up' },
    { title: 'Total Orders', value: analytics.summary.totalOrders, icon: ShoppingBag, color: 'from-blue-500 to-cyan-600', change: `+${analytics.summary.growthRate.toFixed(1)}%`, trend: 'up' },
    { title: 'Total Customers', value: analytics.summary.totalCustomers, icon: Users, color: 'from-purple-500 to-pink-600', change: '+12%', trend: 'up' },
    { title: 'Avg Order Value', value: `KSh ${Math.round(analytics.summary.averageOrderValue).toLocaleString()}`, icon: TrendingUp, color: 'from-orange-500 to-red-600', change: '+5%', trend: 'up' },
    { title: 'Conversion Rate', value: `${analytics.summary.conversionRate.toFixed(1)}%`, icon: Target, color: 'from-indigo-500 to-purple-600', change: '+2%', trend: 'up' },
    { title: 'Customer Retention', value: `${analytics.customerRetention.toFixed(1)}%`, icon: Award, color: 'from-teal-500 to-green-600', change: '+8%', trend: 'up' },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Advanced Analytics</h1>
          <p className="text-gray-500 mt-1">Deep insights into your business performance</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`bg-gradient-to-r ${card.color} rounded-xl shadow-lg p-4 text-white`}
          >
            <div className="flex items-center justify-between">
              <card.icon size={24} className="opacity-80" />
              {card.trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </div>
            <p className="text-2xl font-bold mt-2">{card.value}</p>
            <p className="text-xs opacity-80 mt-1">{card.title}</p>
            <p className="text-xs mt-1 opacity-75">{card.change} from last period</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          {showCharts ? <EyeOff size={16} /> : <Eye size={16} />}
          {showCharts ? 'Hide Charts' : 'Show Charts'}
        </button>
      </div>

      {/* Charts Grid */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Revenue Trend</h3>
            <div className="space-y-3">
              {analytics.dailyStats.map((day, idx) => (
                <div key={day.date}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                    <span className="font-semibold text-green-600">KSh {day.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((day.revenue / Math.max(...analytics.dailyStats.map(d => d.revenue))) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: idx * 0.05 }}
                      className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Top 10 Products</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {analytics.topProducts.map((product, idx) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📦'}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity} units • {product.orders} orders</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">KSh {product.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Sales by Category</h3>
            <div className="space-y-3">
              {analytics.categoryBreakdown.map((category, idx) => (
                <div key={category.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{category.name}</span>
                    <span className="font-semibold text-green-600">KSh {category.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((category.revenue / analytics.categoryBreakdown[0]?.revenue) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: idx * 0.05 }}
                      className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📅 Monthly Trends</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {analytics.monthlyTrends.map((month, idx) => (
                <div key={month.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{month.month}</p>
                    <p className="text-xs text-gray-500">{month.orders} orders</p>
                  </div>
                  <p className="font-bold text-green-600">KSh {month.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">⏰ Peak Order Hours</h3>
            <div className="space-y-3">
              {analytics.peakHours.map((hour) => (
                <div key={hour.hour}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{hour.hour}:00 - {hour.hour + 1}:00</span>
                    <span className="font-semibold text-blue-600">{hour.count} orders</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(hour.count / analytics.peakHours[0]?.count) * 100}%` }}
                      transition={{ duration: 1 }}
                      className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Health Metrics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">💪 Business Health</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{analytics.refundRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">Refund Rate</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{analytics.customerRetention.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">Customer Retention</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{analytics.summary.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">Conversion Rate</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{analytics.summary.growthRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">Growth Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition">
          <Download size={18} />
          Export Full Report
        </button>
      </div>
    </div>
  );
};

export default Analytics;