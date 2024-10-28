const bcrypt = require("bcryptjs");
const db = require("../config/db");

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
