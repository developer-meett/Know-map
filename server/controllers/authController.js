import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Mint a signed JWT for the given user.
 * @param {string} userId
 * @param {boolean} isAdmin
 * @returns {string} signed token
 */
const generateToken = (userId, isAdmin) =>
  jwt.sign(
    { userId, isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
  );

/**
 * Attach a JWT as an httpOnly session cookie on the response.
 * @param {import('express').Response} res
 * @param {string} token
 */
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

/** Fields returned to the client — never expose password. */
const USER_PUBLIC_FIELDS = '_id email displayName photoURL isAdmin role stats';

// ─── register ────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { email, displayName, password }
 */
export const register = async (req, res) => {
  try {
    const { email, displayName, password } = req.body;

    // ── Validation ───────────────────────────────────────────────────────────
    if (!email || !displayName || !password) {
      return res.status(400).json({ success: false, message: 'email, displayName and password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // ── Duplicate check ──────────────────────────────────────────────────────
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with that email already exists.' });
    }

    // ── Create user (password hashed by pre-save hook) ───────────────────────
    const user = await User.create({ email, displayName, password });

    // ── Issue JWT ────────────────────────────────────────────────────────────
    const token = generateToken(user._id, user.isAdmin);
    setTokenCookie(res, token);

    const userObj = await User.findById(user._id).select(USER_PUBLIC_FIELDS).lean();
    return res.status(201).json({ success: true, user: userObj });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ─── login ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required.' });
    }

    // ── Find user ────────────────────────────────────────────────────────────
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // ── Verify password ──────────────────────────────────────────────────────
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // ── Issue JWT ────────────────────────────────────────────────────────────
    const token = generateToken(user._id, user.isAdmin);
    setTokenCookie(res, token);

    const userObj = await User.findById(user._id).select(USER_PUBLIC_FIELDS).lean();
    return res.status(200).json({ success: true, user: userObj });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ─── googleAuth ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/google
 * Body: { idToken }  — Google ID token issued to the frontend
 */
export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'idToken is required.' });
    }

    // ── Verify Google token server-side ──────────────────────────────────────
    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // ── Upsert user ──────────────────────────────────────────────────────────
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // New Google user — provision fresh account
      user = await User.create({
        email,
        displayName: name,
        photoURL:    picture,
        googleId,
        isAdmin:     false,
      });
    } else if (!user.googleId) {
      // Existing email-based user — link Google account
      user.googleId = googleId;
      user.photoURL  = picture;
      await user.save();
    }

    // ── Issue JWT ────────────────────────────────────────────────────────────
    const token = generateToken(user._id, user.isAdmin);
    setTokenCookie(res, token);

    const userObj = await User.findById(user._id).select(USER_PUBLIC_FIELDS).lean();
    return res.status(200).json({ success: true, user: userObj });
  } catch (err) {
    console.error('[googleAuth]', err);
    // google-auth-library throws if token is invalid/expired
    if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token')) {
      return res.status(401).json({ success: false, message: 'Invalid or expired Google token.' });
    }
    return res.status(500).json({ success: false, message: 'Server error during Google sign-in.' });
  }
};

// ─── logout ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/logout
 */
export const logout = (_req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  return res.status(200).json({ success: true, message: 'Logged out.' });
};

// ─── getMe ────────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Requires req.user to be populated by auth middleware (Prompt 4).
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(USER_PUBLIC_FIELDS).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[getMe]', err);
    return res.status(500).json({ success: false, message: 'Server error fetching user.' });
  }
};
