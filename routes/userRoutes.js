const express = require('express');
const { createUser, getUsers, getUserById, updateUser, deleteUser, resetUserPassword, lockUser, unlockUser, resetPasswordEmail } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/create', verifyToken, createUser);
router.get('/', verifyToken, getUsers);
router.get('/:id', verifyToken, getUserById);
router.put('/update', verifyToken, updateUser);
router.delete('/delete', verifyToken, deleteUser);
router.put('/reset-password', verifyToken, resetUserPassword);
router.put('/lock', verifyToken, lockUser); // Route for locking a user
router.put('/unlock', verifyToken, unlockUser); // Route for unlocking a user
router.post('/reset-password-email', verifyToken, resetPasswordEmail);

module.exports = router;
