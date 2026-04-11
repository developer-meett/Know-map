import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─── Main Schema ─────────────────────────────────────────────────────────────

const quizAttemptSchema = new Schema(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    quizId: {
      type:     Schema.Types.ObjectId,
      ref:      'Quiz',
      required: true,
    },

    quizTitle: { type: String, default: null },

    // { "0": 2, "1": 0, ... }  — question index → chosen answer index
    answers: { type: Schema.Types.Mixed, default: {} },

    score:          { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    percentage:     { type: Number, default: 0 },
    isPerfectScore: { type: Boolean, default: false },

    // Matches the shape produced by the Python analytics layer
    topicBreakdown:    { type: Schema.Types.Mixed, default: {} },
    questionBreakdown: { type: [Schema.Types.Mixed], default: [] },

    timeSpent:    { type: Number, default: 0 },        // seconds
    deviceType:   { type: String, default: 'unknown' },
    xpEarned:     { type: Number, default: 0 },
    retryAttempt: { type: Number, default: 1 },

    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ─── Compound index for fast user-history queries ─────────────────────────────
quizAttemptSchema.index({ userId: 1, completedAt: -1 });

// ─── Export ───────────────────────────────────────────────────────────────────

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;
