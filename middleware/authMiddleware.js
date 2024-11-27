const jwt = require("jsonwebtoken");
const { isTokenBlacklisted } = require("../controllers/authController");
require("dotenv").config();
const { logError } = require("../helpers/logHelper");

exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  const functionName = "verifyToken";

  if (!token) {
    const errorMessage = "No token provided";
    logError(functionName, "NO_TOKEN", errorMessage);
    return res.status(403).json({ message: errorMessage });
  }

  // Check if the token is blacklisted
  if (isTokenBlacklisted(token)) {
    const errorMessage = "Token has been invalidated. Please log in again.";
    logError(functionName, "INVALIDATED_TOKEN", errorMessage);
    return res
      .status(401)
      .json({ message: errorMessage });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      const errorMessage = "Failed to authenticate token";
      logError(functionName, "INVALID_TOKEN", errorMessage);
      return res.status(500).json({ message: errorMessage });
    }

    req.curUserUuid = decoded.uuid;
    req.curUserRole = decoded.role || "";
    next();
  });
};
