const jwt = require("jsonwebtoken");

// Middleware to verify token and extract user role
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ success: false, message: "Access Denied" });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), "SECRET_KEY");
    req.user = decoded; // Attach user to request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

// Middleware to check if user is a doctor
const isDoctor = (req, res, next) => {
  if (req.user.role !== "doctor") {
    return res.status(403).json({ success: false, message: "Access Forbidden" });
  }
  next();
};

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access Forbidden" });
  }
  next();
};

// Middleware to check if user is a normal user
const isUser = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ success: false, message: "Access Forbidden" });
  }
  next();
};

module.exports = { verifyToken, isDoctor, isAdmin, isUser };
