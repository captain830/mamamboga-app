const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const driverMiddleware = (req, res, next) => {
  if (req.user.role !== 'driver' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Driver access required' });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  driverMiddleware,
};