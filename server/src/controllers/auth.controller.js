const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendEmail } = require('../utils/email.service');
const crypto = require('crypto');

class AuthController {
  // Register new user
  async register(req, res) {
    const { name, email, phone, password, role = 'customer' } = req.body;

    try {
      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 OR phone = $2',
        [email, phone]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists with this email or phone' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const result = await pool.query(
        `INSERT INTO users (name, email, phone, password, role, verification_token) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, name, email, phone, role, created_at`,
        [name, email, phone, hashedPassword, role, verificationToken]
      );

      const user = result.rows[0];
      
      // Send verification email
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - Mama Mboga',
        template: 'email-verification',
        data: { name, token: verificationToken }
      });

      // Create token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: 'User registered successfully. Please verify your email.',
        user,
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  }

  // Login user
  async login(req, res) {
    const { email, password } = req.body;

    try {
      const result = await pool.query(
        'SELECT id, name, email, phone, password, role, is_active, email_verified FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result.rows[0];
      
      if (!user.is_active) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      if (!user.email_verified) {
        return res.status(401).json({ message: 'Please verify your email first' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  }

  // Verify email
  async verifyEmail(req, res) {
    const { token } = req.params;

    try {
      const result = await pool.query(
        'UPDATE users SET email_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id, email',
        [token]
      );
      
      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid or expired verification token' });
      }
      
      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Verification failed' });
    }
  }

  // Forgot password
  async forgotPassword(req, res) {
    const { email } = req.body;

    try {
      const user = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
      
      if (user.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      await pool.query(
        'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
        [resetToken, resetExpires, email]
      );

      await sendEmail({
        to: email,
        subject: 'Password Reset - Mama Mboga',
        template: 'password-reset',
        data: { name: user.rows[0].name, token: resetToken }
      });

      res.json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Failed to process request' });
    }
  }

  // Reset password
  async resetPassword(req, res) {
    const { token } = req.params;
    const { password } = req.body;

    try {
      const user = await pool.query(
        'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
        [token]
      );
      
      if (user.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      await pool.query(
        'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
        [hashedPassword, user.rows[0].id]
      );

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  }

  // Change password
  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
      const user = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
      
      const isValidPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    const { refreshToken } = req.body;

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.id]);
      
      if (user.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const newToken = jwt.sign(
        { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({ token: newToken });
    } catch (error) {
      res.status(401).json({ message: 'Invalid refresh token' });
    }
  }

  // Logout
  async logout(req, res) {
    // In a real app, you might want to blacklist the token
    res.json({ message: 'Logged out successfully' });
  }
}

module.exports = new AuthController();