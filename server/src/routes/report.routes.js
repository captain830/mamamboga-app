const express = require('express');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Get sales report
router.get('/sales', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;
    
    let dateFormat;
    switch (group_by) {
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      case 'week':
        dateFormat = 'IYYY-IW';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }
    
    const query = `
      SELECT 
        TO_CHAR(created_at, $1) as period,
        COUNT(*) as order_count,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        SUM(CASE WHEN delivery_type = 'delivery' THEN 1 ELSE 0 END) as delivery_orders,
        SUM(CASE WHEN delivery_type = 'pickup' THEN 1 ELSE 0 END) as pickup_orders
      FROM orders
      WHERE created_at >= COALESCE($2, '2024-01-01')
        AND created_at <= COALESCE($3, CURRENT_DATE)
        AND status != 'cancelled'
      GROUP BY period
      ORDER BY period DESC
      LIMIT 30
    `;
    
    const result = await pool.query(query, [dateFormat, start_date || null, end_date || null]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ message: 'Failed to generate sales report' });
  }
});

// Get product sales report
router.get('/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { start_date, end_date, limit = 20 } = req.query;
    
    const query = `
      SELECT 
        p.id,
        p.name,
        p.category,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.total) as total_revenue,
        COUNT(DISTINCT o.id) as order_count
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= COALESCE($1, '2024-01-01')
        AND o.created_at <= COALESCE($2, CURRENT_DATE)
        AND o.status != 'cancelled'
      GROUP BY p.id, p.name, p.category
      ORDER BY total_quantity_sold DESC
      LIMIT $3
    `;
    
    const result = await pool.query(query, [start_date || null, end_date || null, limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Product sales report error:', error);
    res.status(500).json({ message: 'Failed to generate product sales report' });
  }
});

// Get customer report
router.get('/customers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_spent,
        AVG(o.total_amount) as average_order_value,
        MAX(o.created_at) as last_order_date,
        MIN(o.created_at) as first_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
      WHERE u.role = 'customer'
      GROUP BY u.id, u.name, u.email, u.phone
      HAVING COUNT(o.id) > 0
      ORDER BY total_spent DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Customer report error:', error);
    res.status(500).json({ message: 'Failed to generate customer report' });
  }
});

// Get inventory report
router.get('/inventory', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        category,
        COUNT(*) as total_products,
        SUM(stock) as total_stock,
        SUM(CASE WHEN stock < 10 THEN 1 ELSE 0 END) as low_stock_products,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN is_available = false THEN 1 ELSE 0 END) as unavailable
      FROM products
      GROUP BY category
      ORDER BY category
    `;
    
    const result = await pool.query(query);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ message: 'Failed to generate inventory report' });
  }
});

// Get dashboard stats
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM deliveries WHERE status != 'delivered') as active_deliveries,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'cancelled') as total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at::date = $1) as today_revenue,
        (SELECT COUNT(*) FROM orders WHERE created_at::date = $1) as today_orders,
        (SELECT COUNT(*) FROM users WHERE created_at::date = $1) as new_customers_today,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at::date >= $2) as weekly_revenue,
        (SELECT COUNT(*) FROM orders WHERE created_at::date >= $2) as weekly_orders
    `, [today, lastWeek]);
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;