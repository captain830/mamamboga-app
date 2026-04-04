const db = require('../config/database');

// Minimum requirements for serious buyer status
const SERIOUS_BUYER_REQUIREMENTS = {
  minOrders: 2,
  minSpent: 500, // KSh
  minAccountAgeDays: 7,
  requiredVerifications: ['email', 'phone']
};

// Check if user is a serious buyer
const isSeriousBuyer = async (userId) => {
  const result = await db.query(`
    SELECT 
      COUNT(*) as order_count,
      COALESCE(SUM(total_amount), 0) as total_spent,
      EXTRACT(DAY FROM (CURRENT_TIMESTAMP - created_at)) as account_age_days,
      is_verified,
      phone_verified
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.id = $1
    GROUP BY u.id, u.created_at, u.is_verified, u.phone_verified
  `, [userId]);
  
  const user = result.rows[0];
  
  if (!user) return false;
  
  return (
    user.order_count >= SERIOUS_BUYER_REQUIREMENTS.minOrders &&
    user.total_spent >= SERIOUS_BUYER_REQUIREMENTS.minSpent &&
    user.account_age_days >= SERIOUS_BUYER_REQUIREMENTS.minAccountAgeDays &&
    user.is_verified === true
  );
};

// Get user trust score
const getTrustScore = async (userId) => {
  const result = await db.query(`
    SELECT 
      COUNT(*) as order_count,
      COALESCE(SUM(total_amount), 0) as total_spent,
      COUNT(DISTINCT CASE WHEN status = 'delivered' THEN id END) as completed_orders,
      COUNT(DISTINCT CASE WHEN status = 'cancelled' THEN id END) as cancelled_orders
    FROM orders
    WHERE user_id = $1
  `, [userId]);
  
  const stats = result.rows[0];
  
  let score = 0;
  score += Math.min(stats.order_count * 10, 50); // Max 50 points for orders
  score += Math.min(stats.total_spent / 100, 30); // Max 30 points for spending
  score += stats.completed_orders * 5; // 5 points per completed order
  score -= stats.cancelled_orders * 10; // -10 points per cancellation
  
  return Math.max(0, Math.min(100, score));
};

module.exports = { isSeriousBuyer, getTrustScore };