const jwt = require("jsonwebtoken");
const { isTokenBlacklisted } = require("../controllers/authController");
require("dotenv").config();

exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(403).json({ message: "No token provided" });

  // Check if the token is blacklisted
  if (isTokenBlacklisted(token)) {
    return res
      .status(401)
      .json({ message: "Token has been invalidated. Please log in again." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(500).json({ message: "Failed to authenticate token" });

    req.curUserUuid = decoded.uuid;
    req.curUserRole = decoded.role || "";
    next();
  });
};
