const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all users (admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT id, name, email, phone, role, avatar_url, is_active, created_at, last_login
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    
    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, avatar_url, is_active, created_at, last_login
       FROM users WHERE id = $1`,
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, [
  body('name').optional().isString(),
  body('phone').optional().isString(),
  body('avatar_url').optional().isURL(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, phone, avatar_url } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, email, phone, role, avatar_url`,
      [name, phone, avatar_url, req.userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Update user role (admin)
router.put('/:id/role', authMiddleware, adminMiddleware, [
  body('role').isIn(['customer', 'admin', 'driver']).withMessage('Invalid role'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { role } = req.body;

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role',
      [role, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Activate/deactivate user (admin)
router.put('/:id/toggle-status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, email, is_active',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Failed to toggle user status' });
  }
});

// Get user notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const { unread_only = false, limit = 50 } = req.query;
    
    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const params = [req.userId];
    let paramIndex = 2;

    if (unread_only === 'true') {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [req.userId]
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

module.exports = router;