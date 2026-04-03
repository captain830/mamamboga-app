const db = require('../config/database');
const { validationResult } = require('express-validator');

// @desc    Submit feedback
const submitFeedback = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { subject, message, category } = req.body;

    try {
        const query = `
            INSERT INTO feedback (user_id, subject, message, category)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await db.query(query, [req.user.id, subject, message, category || 'feedback']);
        res.status(201).json({ success: true, feedback: result.rows[0] });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ message: 'Failed to submit feedback' });
    }
};

// @desc    Get user feedback
const getUserFeedback = async (req, res) => {
    try {
        const query = 'SELECT * FROM feedback WHERE user_id = $1 ORDER BY created_at DESC';
        const result = await db.query(query, [req.user.id]);
        res.json({ success: true, feedback: result.rows });
    } catch (error) {
        console.error('Get user feedback error:', error);
        res.status(500).json({ message: 'Failed to fetch feedback' });
    }
};

// @desc    Get all feedback (admin)
const getAllFeedback = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT f.*, u.name as user_name, u.email as user_email
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        if (status && status !== 'all') {
            query += ` AND f.status = $${paramCount}`;
            values.push(status);
            paramCount++;
        }

        query += ` ORDER BY 
            CASE f.status 
                WHEN 'pending' THEN 1 
                WHEN 'reviewed' THEN 2 
                ELSE 3 
            END, 
            f.created_at DESC`;
        
        const result = await db.query(query, values);
        res.json({ success: true, feedback: result.rows });
    } catch (error) {
        console.error('Get all feedback error:', error);
        res.status(500).json({ message: 'Failed to fetch feedback' });
    }
};

// @desc    Reply to feedback (admin)
const replyToFeedback = async (req, res) => {
    const { admin_reply } = req.body;

    if (!admin_reply) {
        return res.status(400).json({ message: 'Reply message is required' });
    }

    try {
        const query = `
            UPDATE feedback 
            SET admin_reply = $1, status = 'resolved', replied_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const result = await db.query(query, [admin_reply, req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        res.json({ success: true, feedback: result.rows[0] });
    } catch (error) {
        console.error('Reply to feedback error:', error);
        res.status(500).json({ message: 'Failed to send reply' });
    }
};

// @desc    Update feedback status (admin)
const updateFeedbackStatus = async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'reviewed', 'resolved'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const query = 'UPDATE feedback SET status = $1 WHERE id = $2 RETURNING *';
        const result = await db.query(query, [status, req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        res.json({ success: true, feedback: result.rows[0] });
    } catch (error) {
        console.error('Update feedback status error:', error);
        res.status(500).json({ message: 'Failed to update status' });
    }
};

// @desc    Delete feedback (admin)
const deleteFeedback = async (req, res) => {
    try {
        const query = 'DELETE FROM feedback WHERE id = $1 RETURNING id';
        const result = await db.query(query, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        res.json({ success: true, message: 'Feedback deleted' });
    } catch (error) {
        console.error('Delete feedback error:', error);
        res.status(500).json({ message: 'Failed to delete feedback' });
    }
};

module.exports = { submitFeedback, getUserFeedback, getAllFeedback, replyToFeedback, updateFeedbackStatus, deleteFeedback };