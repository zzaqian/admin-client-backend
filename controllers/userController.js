const bcrypt = require("bcryptjs");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();
const { logActivity } = require("../helpers/logHelper");

// Create a new user
exports.createUser = (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const uuid = crypto.randomUUID();
  // console.log(hashedPassword);
  // console.log(uuid);

  db.query(
    "INSERT INTO users (uuid, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
    [uuid, name, email, hashedPassword, role],
    (err, results) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(409).json({ message: "Duplicate email" });
        else throw err;
      }

      // Log the activity
      logActivity(
        "User",
        "Create User",
        `Created user with name: ${name} and email: ${email}`,
        req.curUserUuid,
        uuid
      );

      res.json({
        message: "User created successfully",
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

// Get details of a specific user by uuid
exports.getUserByUuid = (req, res) => {
  const { uuid } = req.params;
  db.query("SELECT * FROM users WHERE uuid = ?", [uuid], (err, results) => {
    if (err) return res.status(500).json({ message: "Database query failed" });
    if (results.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json(results[0]);
  });
};

// Update a user
exports.updateUser = (req, res) => {
  const { uuid, name, email, role } = req.body;

  db.query(
    "UPDATE users SET name = ?, email = ?, role = ? WHERE uuid = ?",
    [name, email, role, uuid],
    (err, results) => {
      if (err) throw err;

      // Log the activity
      logActivity(
        "User",
        "Update User",
        `Updated user with new name: ${name}, new email: ${email}, and new role: ${role}`,
        req.curUserUuid,
        uuid
      );

      res.json({ message: "User updated successfully" });
    }
  );
};

// Delete a user
exports.deleteUser = (req, res) => {
  const { uuid } = req.body;
  db.query("DELETE FROM users WHERE uuid = ?", [uuid], (err, results) => {
    if (err) throw err;

    // Log the activity
    logActivity("User", "Delete User", `Deleted user`, req.curUserUuid, uuid);

    res.json({ message: "User deleted successfully" });
  });
};

// Lock a user and save the reason
exports.lockUser = (req, res) => {
  const { uuid, lock_reason } = req.body;
  db.query(
    "UPDATE users SET status = 'Locked', lock_reason = ? WHERE uuid = ?",
    [lock_reason, uuid],
    (err) => {
      if (err) return res.status(500).json({ message: "Failed to lock user" });

      // Log the activity
      logActivity(
        "User",
        "Lock User",
        `Locked user with Reason: ${lock_reason}`,
        req.curUserUuid,
        uuid
      );

      res.json({ message: "User locked successfully" });
    }
  );
};

// Unlock a user
exports.unlockUser = (req, res) => {
  const { uuid } = req.body;
  db.query(
    "UPDATE users SET status = 'Active', lock_reason = NULL WHERE uuid = ?",
    [uuid],
    (err) => {
      if (err)
        return res.status(500).json({ message: "Failed to unlock user" });

      // Log the activity
      logActivity(
        "User",
        "Unlock User",
        `Unlocked user`,
        req.curUserUuid,
        uuid
      );

      res.json({ message: "User unlocked successfully" });
    }
  );
};

// Simulate password reset email
exports.resetPasswordEmail = async (req, res) => {
  const { uuid, email, reset_reason } = req.body;

  try {
    // Generate a password reset token (expires in 1 hour)
    const resetToken = jwt.sign({ uuid: uuid }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Email transporter setup
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    const mailOptions = {
      to: email,
      subject: "Password Reset Request",
      text: `Reason: ${reset_reason}\n\nTo reset your password, please click the link below:\n${resetLink}`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to send password reset email" });
  }

  db.query(
    "UPDATE users SET reset_reason = ? WHERE uuid = ?",
    [reset_reason, uuid],
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Failed to set reset password reason" });

      // Log the activity
      logActivity(
        "User",
        "Reset Password Email",
        `Password reset email sent with Reason: ${reset_reason}`,
        req.curUserUuid,
        uuid
      );

      return res.json({ message: "Password reset email sent successfully" });
    }
  );
};

// Reset a user's password
exports.resetPasswordConfirm = async (req, res) => {
  const { newPassword } = req.body;
  const curUserUuid = req.curUserUuid;

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    db.query(
      "UPDATE users SET password = ? WHERE uuid = ?",
      [hashedPassword, curUserUuid],
      (err, result) => {
        if (err)
          return res.status(500).json({ message: "Failed to reset password" });

        // Log the activity
        logActivity(
          "User",
          "Reset Password Confirm",
          `User reset password`,
          curUserUuid,
          curUserUuid
        );

        res.json({ message: "Password reset successfully" });
      }
    );
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};
