const db = require('../config/database');

// Check if user is verified
const requireVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      'SELECT is_verified, account_locked FROM users WHERE id = $1',
      [userId]
    );
    
    if (!result.rows[0]?.is_verified) {
      return res.status(403).json({ 
        message: 'Account not verified. Please verify your email/phone to continue.',
        requiresVerification: true
      });
    }
    
    if (result.rows[0]?.account_locked) {
      return res.status(403).json({ 
        message: 'Account locked. Contact support.',
        accountLocked: true
      });
    }
    
    next();
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Verification check failed' });
  }
};

// Track user activity for serious buyer detection
const trackActivity = async (req, res, next) => {
  const userId = req.user?.id;
  if (userId) {
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }
  next();
};

module.exports = { requireVerification, trackActivity };