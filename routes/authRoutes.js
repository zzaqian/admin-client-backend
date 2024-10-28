const express = require('express');
const { logout, login, getRole } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/logout', verifyToken, logout);
router.post('/login', login);
router.get('/get-role', verifyToken, getRole);

module.exports = router;
