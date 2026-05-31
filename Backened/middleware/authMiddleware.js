// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

/**
 * Auth Middleware
 * Protects endpoints by verifying the client-side JWT token trace payload
 */
exports.protect = async (req, res, next) => {
  try {
    // Extract token from incoming Authorization header wrapper (Bearer <token>)
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: No authentication token provided."
      });
    }

    // Verify token against your cluster's environment secret variable keys
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Inject the decoded token payload identity variables directly into the request scope
    req.user = decoded;

    // Route traffic smoothly down to the next controller function execution branch
    next();

  } catch (error) {
    console.error("⚠️ Authentication Token Validation Failure:", error.message);
    
    return res.status(401).json({
      success: false,
      message: "Access Denied: Invalid or expired authentication token payload signature."
    });
  }
};