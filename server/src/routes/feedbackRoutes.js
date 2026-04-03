const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { protect, authorize } = require('../middleware/auth');

// Submit feedback - Improved for new users
router.post('/', protect, async (req, res) => {
    try {
        const { subject, message, category } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;
        
        if (!subject || !message) {
            return res.status(400).json({ message: 'Subject and message are required' });
        }
        
        // Check if user exists in database
        const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
        
        let finalUserId = userId;
        
        if (userCheck.rows.length === 0) {
            // User doesn't exist - create them first
            console.log(`User ${userId} not found, creating...`);
            try {
                const createUser = await db.query(
                    `INSERT INTO users (id, name, email, role, is_active, created_at) 
                     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                     ON CONFLICT (id) DO NOTHING
                     RETURNING id`,
                    [userId, req.user.name || 'Customer', userEmail, 'customer', true]
                );
                if (createUser.rows.length > 0) {
                    console.log(`✅ Created user ${userId} in database`);
                    finalUserId = userId;
                } else {
                    finalUserId = 1; // Fallback to admin
                }
            } catch (err) {
                console.log('Could not create user, using fallback');
                finalUserId = 1;
            }
        }
        
        const result = await db.query(
            `INSERT INTO feedback (user_id, subject, message, category, created_at) 
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
             RETURNING *`,
            [finalUserId, subject, message, category || 'feedback']
        );
        
        console.log(`✅ Feedback saved for user ${finalUserId} (${userEmail})`);
        res.status(201).json({ success: true, feedback: result.rows[0] });
        
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ message: 'Failed to submit feedback' });
    }
});

// Get MY feedback - Customer sees ONLY their own feedback
router.get('/my', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;
        
        // ONLY get feedback for this specific user
        const result = await db.query(
            `SELECT f.* 
             FROM feedback f
             WHERE f.user_id = $1
             ORDER BY f.created_at DESC`,
            [userId]
        );
        
        console.log(`📦 Customer ${userId} sees ${result.rows.length} of their own feedback (not all)`);
        
        // Format response with user info from token
        const feedbackWithUser = result.rows.map(f => ({
            ...f,
            user_name: req.user.name,
            user_email: userEmail
        }));
        
        res.json({ success: true, feedback: feedbackWithUser });
    } catch (error) {
        console.error('Get my feedback error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch feedback' });
    }
});

// Get all feedback (admin only) - with user info
router.get('/all', protect, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = `
            SELECT f.*, u.name as user_name, u.email as user_email, u.phone as user_phone
            FROM feedback f
            LEFT JOIN users u ON f.user_id = u.id
        `;
        
        const params = [];
        if (status && status !== 'all') {
            query += ` WHERE f.status = $1`;
            params.push(status);
        }
        
        query += ` ORDER BY f.created_at DESC`;
        
        const result = await db.query(query, params);
        
        console.log(`📦 Admin returning ${result.rows.length} feedback items`);
        res.json({ success: true, feedback: result.rows });
    } catch (error) {
        console.error('Get all feedback error:', error);
        res.status(500).json({ message: 'Failed to fetch feedback' });
    }
});

// Admin reply to feedback
router.put('/:id/reply', protect, authorize('admin'), async (req, res) => {
    try {
        const { admin_reply } = req.body;
        const { id } = req.params;
        
        if (!admin_reply) {
            return res.status(400).json({ message: 'Reply message is required' });
        }
        
        const result = await db.query(
            `UPDATE feedback 
             SET admin_reply = $1, 
                 status = 'reviewed',
                 replied_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [admin_reply, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        
        console.log(`✅ Admin replied to feedback ${id}`);
        res.json({ success: true, feedback: result.rows[0] });
        
    } catch (error) {
        console.error('Reply error:', error);
        res.status(500).json({ message: 'Failed to send reply' });
    }
});

// Update status (admin only)
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        
        const validStatuses = ['pending', 'reviewed', 'resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        const result = await db.query(
            `UPDATE feedback 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING *`,
            [status, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        
        console.log(`✅ Feedback ${id} status updated to ${status}`);
        res.json({ success: true, feedback: result.rows[0] });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Failed to update status' });
    }
});

// Delete feedback (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            `DELETE FROM feedback WHERE id = $1 RETURNING id`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        
        console.log(`✅ Feedback ${id} deleted`);
        res.json({ success: true, message: 'Feedback deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Failed to delete feedback' });
    }
});

// Get feedback statistics (admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
                COUNT(CASE WHEN category = 'feedback' THEN 1 END) as feedback_count,
                COUNT(CASE WHEN category = 'bug' THEN 1 END) as bug_count,
                COUNT(CASE WHEN category = 'feature' THEN 1 END) as feature_count,
                COUNT(CASE WHEN category = 'complaint' THEN 1 END) as complaint_count,
                COUNT(CASE WHEN category = 'question' THEN 1 END) as question_count
            FROM feedback
        `);
        
        res.json({ success: true, stats: result.rows[0] });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});

module.exports = router;