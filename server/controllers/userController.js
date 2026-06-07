import User from '../models/User.js';
import QuizAttempt from '../models/QuizAttempt.js';

const USER_PUBLIC_FIELDS = '_id email displayName photoURL isAdmin role bio preferences stats createdAt';

// ─── getMyProfile ─────────────────────────────────────────────────────────────
/**
 * GET /api/users/me
 * Protected — returns the authenticated user's full profile.
 */
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select(USER_PUBLIC_FIELDS)
      .lean();

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[getMyProfile]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── updateMyProfile ──────────────────────────────────────────────────────────
/**
 * PATCH /api/users/me
 * Protected — lets a user update their own displayName, bio, photoURL and preferences.
 */
export const updateMyProfile = async (req, res) => {
  try {
    const allowed = ['displayName', 'bio', 'photoURL', 'preferences'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided.' });
    }

    // Flatten preferences to prevent full-object replacement
    const mongoUpdates = {};
    for (const [key, val] of Object.entries(updates)) {
      if (key === 'preferences' && typeof val === 'object') {
        for (const [pKey, pVal] of Object.entries(val)) {
          mongoUpdates[`preferences.${pKey}`] = pVal;
        }
      } else {
        mongoUpdates[key] = val;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: mongoUpdates },
      { new: true, runValidators: true }
    ).select(USER_PUBLIC_FIELDS).lean();

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[updateMyProfile]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── listUsers (admin) ────────────────────────────────────────────────────────
/**
 * GET /api/admin/users
 * Admin only — paginated list of all users.
 * Query: page (default 1), limit (default 20), search (email/name substring)
 */
export const listUsers = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const skip   = (page - 1) * limit;
    const search = req.query.search?.trim();

    const filter = search
      ? { $or: [
          { email:       { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } },
        ] }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter).select(USER_PUBLIC_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), users });
  } catch (err) {
    console.error('[listUsers]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── deleteUser (admin) ───────────────────────────────────────────────────────
/**
 * DELETE /api/admin/users/:id
 * Admin only — permanently remove a user account.
 */
export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ success: false, message: 'Admins cannot delete their own account.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Cascade-delete all quiz attempts belonging to this user
    await QuizAttempt.deleteMany({ userId: req.params.id });

    return res.status(200).json({ success: true, message: 'User and all their quiz attempts deleted.' });
  } catch (err) {
    console.error('[deleteUser]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── changeUserRole (admin) ───────────────────────────────────────────────────
/**
 * PATCH /api/admin/users/:id/role
 * Admin only — promote or demote a user.
 * Body: { role: 'student' | 'admin', isAdmin?: boolean }
 */
export const changeUserRole = async (req, res) => {
  try {
    const { role, isAdmin } = req.body;

    if (req.params.id === req.user.userId) {
      return res.status(400).json({ success: false, message: 'You cannot change your own admin role.' });
    }

    const validRoles = ['student', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `role must be one of: ${validRoles.join(', ')}` });
    }

    const updates = {};
    if (role !== undefined)    updates.role    = role;
    if (isAdmin !== undefined) updates.isAdmin = Boolean(isAdmin);

    // Keep role and isAdmin in sync if only one is supplied
    if (role === 'admin'   && isAdmin === undefined) updates.isAdmin = true;
    if (role === 'student' && isAdmin === undefined) updates.isAdmin = false;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select(USER_PUBLIC_FIELDS).lean();

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[changeUserRole]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
