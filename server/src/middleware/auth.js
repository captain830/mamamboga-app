const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
            
            // Try to get user from database, but don't fail if not found
            let user = null;
            try {
                user = await User.findById(decoded.id);
            } catch (dbError) {
                console.log('Database user lookup failed, using token data');
            }
            
            // If user found in DB, use it; otherwise create from token
            if (user) {
                req.user = user;
            } else {
                // Fallback for in-memory users or when DB table doesn't exist
                req.user = {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role || 'customer',
                    name: 'User'
                };
            }
            
            next();
        } catch (error) {
            console.error('Auth error:', error.message);
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role ${req.user.role} is not authorized`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };