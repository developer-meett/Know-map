import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const preferencesSchema = new Schema(
  {
    emailNotifications: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    difficultyPreference: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'adaptive'],
      default: 'adaptive',
    },
    favoriteTopics: { type: [String], default: [] },
  },
  { _id: false }
);

const statsSchema = new Schema(
  {
    totalQuizzesTaken: { type: Number, default: 0 },
    totalTimeSpent:    { type: Number, default: 0 }, // minutes
    totalXP:           { type: Number, default: 0 },
    level:             { type: Number, default: 1 },
    averageScore:      { type: Number, default: 0 },
    perfectScores:     { type: Number, default: 0 },
  },
  { _id: false }
);

// ─── Main Schema ─────────────────────────────────────────────────────────────

const userSchema = new Schema(
  {
    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    // Optional — Google-only users won't have a password
    password: { type: String, default: null },

    displayName: { type: String, required: true },
    photoURL:    { type: String, default: null },

    // Sparse index so multiple users without a googleId can coexist
    googleId: { type: String, default: null, index: { sparse: true } },

    isAdmin: { type: Boolean, default: false },
    role:    { type: String, enum: ['student', 'admin'], default: 'student' },

    bio: { type: String, default: null },

    preferences: { type: preferencesSchema, default: () => ({}) },
    stats:       { type: statsSchema,       default: () => ({}) },
  },
  { timestamps: true }
);

// ─── Pre-save Hook ────────────────────────────────────────────────────────────

userSchema.pre('save', async function (next) {
  // Only hash if password field was modified and the value is not null
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * Compares a plain-text candidate password against the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Export ───────────────────────────────────────────────────────────────────

const User = mongoose.model('User', userSchema);
export default User;
