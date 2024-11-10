const express = require("express");
const {
  createUser,
  getUsers,
  getUserByUuid,
  updateUser,
  deleteUser,
  lockUser,
  unlockUser,
  resetPasswordEmail,
  resetPasswordConfirm,
} = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/create", verifyToken, createUser);
router.get("/", verifyToken, getUsers);
router.get("/:uuid", verifyToken, getUserByUuid);
router.put("/update", verifyToken, updateUser);
router.delete("/delete", verifyToken, deleteUser);
router.put("/lock", verifyToken, lockUser); // Route for locking a user
router.put("/unlock", verifyToken, unlockUser); // Route for unlocking a user
router.post("/reset-password-email", verifyToken, resetPasswordEmail);
router.post("/reset-password-confirm", verifyToken, resetPasswordConfirm);

module.exports = router;
