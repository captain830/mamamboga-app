const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async findById(id) {
        try {
            const query = 'SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = $1';
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error('User.findById error:', error.message);
            // For in-memory users (since Neon might not have users table yet)
            // Return null to allow fallback
            return null;
        }
    }

    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
}

module.exports = User;