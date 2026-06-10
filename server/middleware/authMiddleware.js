import jwt from 'jsonwebtoken';

// ─── protect ─────────────────────────────────────────────────────────────────
/**
 * Middleware: verify the JWT from:
 *   (1) req.cookies.token  — httpOnly cookie set by auth controller
 *   (2) Authorization: Bearer <token>  — for API clients / mobile
 *
 * On success, sets req.user = { userId, isAdmin } and calls next().
 */
export const protect = (req, res, next) => {
  try {
    // Priority 1 — cookie
    let token = req.cookies?.token;

    // Priority 2 — Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, isAdmin: decoded.isAdmin };
    next();
  } catch (err) {
    // Handles TokenExpiredError, JsonWebTokenError, etc.
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ─── adminOnly ────────────────────────────────────────────────────────────────
/**
 * Middleware: must be chained AFTER protect.
 * Allows the request only if req.user.isAdmin === true.
 */
export const adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

export const optionalAuth = (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { userId: decoded.userId, isAdmin: decoded.isAdmin };
    }
  } catch (err) {}
  next();
};
