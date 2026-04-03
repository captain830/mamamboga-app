// Simple analytics without external dependencies
const getOrderStats = (orders) => {
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Get sales by day for last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();
  
  const salesByDay = last7Days.map(date => {
    const dayOrders = orders.filter(o => o.created_at.split('T')[0] === date);
    return {
      date,
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + o.total_amount, 0)
    };
  });
  
  // Top products
  const productSales = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { quantity: 0, revenue: 0 };
      }
      productSales[item.product_name].quantity += item.quantity;
      productSales[item.product_name].revenue += item.price * item.quantity;
    });
  });
  
  const topProducts = Object.entries(productSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  
  // Monthly revenue
  const monthlyRevenue = {};
  orders.forEach(order => {
    const month = new Date(order.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!monthlyRevenue[month]) {
      monthlyRevenue[month] = 0;
    }
    monthlyRevenue[month] += order.total_amount;
  });
  
  return {
    totalOrders,
    completedOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    confirmedOrders,
    cancelledOrders,
    totalRevenue,
    averageOrderValue,
    salesByDay,
    topProducts,
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }))
  };
};

module.exports = { getOrderStats };