const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
require("dotenv").config();
const { logActivity, logError } = require("../helpers/logHelper");

// In-memory blacklist for tokens
let tokenBlacklist = [];

// Logout function to invalidate JWT
exports.logout = (req, res) => {
  const token = req.headers["authorization"]; // Get the JWT token from the Authorization header
  const uuid = req.curUserUuid;

  if (!token) {
    const errorMessage = "No token provided";
    logError("logout", "NO_TOKEN", errorMessage);
    return res.status(403).json({ message: errorMessage });
  }

  // Add the token to the blacklist
  tokenBlacklist.push(token);

  // Log the activity
  logActivity("User", "Logout", `User logged out`, uuid, uuid);

  res.status(200).json({ message: "Logged out successfully" });
};

// Middleware to check if token is blacklisted
exports.isTokenBlacklisted = (token) => {
  return tokenBlacklist.includes(token);
};

// Login and generate JWT token
exports.login = (req, res) => {
  const { email, password } = req.body;
  const functionName = "login";
  // console.log(bcrypt.hashSync(password, 10));

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) {
      logError(functionName, err.code, err.sqlMessage);
      throw err;
    }

    if (results.length > 0) {
      const user = results[0];

      if (user.status === "Locked") {
        logError(functionName, "ACCOUNT_LOCKED", "Account locked");
        return res.status(423).json({ message: "Account locked" });
      }

      // Check if password matches
      const passwordMatch = bcrypt.compareSync(password, user.password);
      if (passwordMatch) {
        const uuid = user.uuid;
        const token = jwt.sign(
          { uuid: uuid, role: user.role },
          process.env.JWT_SECRET,
          {
            expiresIn: "1h",
          }
        );

        // Log the activity
        logActivity(
          "User",
          "Login",
          `User logged in with email: ${email}`,
          uuid,
          uuid
        );

        res.json({ token, message: "Logged in successfully" });
      } else {
        logError(functionName, "INCORRECT_PASSWORD", "Invalid password");
        res.status(401).json({ message: "Invalid password" });
      }
    } else {
      logError(functionName, "USER_NOT_FOUND", "User not found");
      res.status(404).json({ message: "User not found" });
    }
  });
};

// Login and generate JWT token
exports.getRole = (req, res) => {
  res
    .status(200)
    .json({ message: "Valid Token", curUserRole: req.curUserRole });
};
