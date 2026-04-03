const { pool } = require('../config/database');

// Create notification
async function createNotification({ userId, title, message, type = 'info', metadata = null }) {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, title, message, type, metadata ? JSON.stringify(metadata) : null]
    );
    
    // In a real app, you might also send push notifications or WebSocket events here
    return result.rows[0];
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

// Get user notifications
async function getUserNotifications(userId, limit = 50, unreadOnly = false) {
  try {
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = $1
    `;
    const params = [userId];
    
    if (unreadOnly) {
      query += ` AND is_read = false`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $2`;
    params.push(limit);
    
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Get notifications error:', error);
    return [];
  }
}

// Mark notification as read
async function markAsRead(notificationId, userId) {
  try {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Mark as read error:', error);
    return null;
  }
}

// Mark all as read
async function markAllAsRead(userId) {
  try {
    await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return true;
  } catch (error) {
    console.error('Mark all as read error:', error);
    return false;
  }
}

// Delete notification
async function deleteNotification(notificationId, userId) {
  try {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Delete notification error:', error);
    return false;
  }
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};