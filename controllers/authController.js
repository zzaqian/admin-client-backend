const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
require('dotenv').config();

// In-memory blacklist for tokens
let tokenBlacklist = [];

// Logout function to invalidate JWT
exports.logout = (req, res) => {
    const token = req.headers['authorization']; // Get the JWT token from the Authorization header

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    // Add the token to the blacklist
    tokenBlacklist.push(token);

    res.status(200).json({ message: 'Logged out successfully' });
};

// Middleware to check if token is blacklisted
exports.isTokenBlacklisted = (token) => {
    return tokenBlacklist.includes(token);
};

// Login and generate JWT token
exports.login = (req, res) => {
    const { email, password } = req.body;
    // console.log(bcrypt.hashSync(password, 10));
    
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) throw err;
        
        if (results.length > 0) {
            const user = results[0];

            if (user.status === "Locked") {
                return res.status(423).json({ message: 'Account locked' });
            }

            // Check if password matches
            const passwordMatch = bcrypt.compareSync(password, user.password);
            if (passwordMatch) {
                const token = jwt.sign({ uuid: user.uuid, role: user.role }, process.env.JWT_SECRET, {
                    expiresIn: '1h',
                });
                res.json({ token });
            } else {
                res.status(401).json({ message: 'Invalid password' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });
};

// Login and generate JWT token
exports.getRole = (req, res) => {
    res.status(200).json({ message: 'Valid Token', curUserRole: req.curUserRole });
};
