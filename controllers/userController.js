const bcrypt = require("bcryptjs");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Create a new user
exports.createUser = (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, role],
    (err, results) => {
      if (err) throw err;
      res.json({
        message: "User created successfully",
        userId: results.insertId,
      });
    }
  );
};

// Get all users
exports.getUsers = (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
};

// Get details of a specific user by ID
exports.getUserById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM users WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database query failed" });
    if (results.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json(results[0]);
  });
};

// Update a user
exports.updateUser = (req, res) => {
  const { id, name, email, role } = req.body;
  db.query(
    "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?",
    [name, email, role, id],
    (err, results) => {
      if (err) throw err;
      res.json({ message: "User updated successfully" });
    }
  );
};

// Delete a user
exports.deleteUser = (req, res) => {
  const { id } = req.body;
  db.query("DELETE FROM users WHERE id = ?", [id], (err, results) => {
    if (err) throw err;
    res.json({ message: "User deleted successfully" });
  });
};

// Reset a user's password
exports.resetUserPassword = (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.query(
    "UPDATE users SET password = ? WHERE email = ?",
    [hashedPassword, email],
    (err, results) => {
      if (err) throw err;
      res.json({ message: "Password reset successfully" });
    }
  );
};

// Lock a user and save the reason
exports.lockUser = (req, res) => {
  const { id, lock_reason } = req.body;
  db.query(
    "UPDATE users SET status = 'Locked', lock_reason = ? WHERE id = ?",
    [lock_reason, id],
    (err) => {
      if (err) return res.status(500).json({ message: "Failed to lock user" });
      res.json({ message: "User locked successfully" });
    }
  );
};

// Unlock a user
exports.unlockUser = (req, res) => {
  const { id } = req.body;
  db.query(
    "UPDATE users SET status = 'Active', lock_reason = NULL WHERE id = ?",
    [id],
    (err) => {
      if (err)
        return res.status(500).json({ message: "Failed to unlock user" });
      res.json({ message: "User unlocked successfully" });
    }
  );
};

// Simulate password reset email
exports.resetPasswordEmail = async (req, res) => {
  const { userId, userEmail, reset_reason } = req.body;

  db.query(
    "UPDATE users SET reset_reason = ? WHERE id = ?",
    [reset_reason, userId],
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Failed to set reset password reason" });
      res.json({ message: "User reset password reason stored successfully" });
    }
  );

  try {
    // Generate a password reset token (expires in 1 hour)
    const resetToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Email transporter setup
    const transporter = nodemailer.createTransport({
      pool: true,
      host: "localhost",
      port: 465,
      secure: true, // use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Password Reset Request",
      text: `Reason: ${reset_reason}\n\nTo reset your password, please click the link below:\n${resetLink}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send password reset email" });
  }
};
