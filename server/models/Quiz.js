import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─── Question Sub-schema ──────────────────────────────────────────────────────

const questionSchema = new Schema(
  {
    id:          { type: String },                          // admin-assigned ID
    question:    { type: String, required: true },
    options:     { type: [String], required: true },       // exactly 4 option strings
    correct:     { type: Number, required: true },          // index 0-3
    topic:       { type: String, required: true },
    subtopic:    { type: String, default: 'General' },
    difficulty:  { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    weight:      { type: Number, default: 2 },
    explanation: { type: String, default: null },
  },
  { _id: false }
);

// ─── Main Schema ──────────────────────────────────────────────────────────────

const quizSchema = new Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref:  'User',
      default: null,
    },

    difficulty: {
      type:    String,
      enum:    ['easy', 'medium', 'hard'],
      default: 'medium',
    },

    questions: { type: [questionSchema], default: [] },

    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── Export ───────────────────────────────────────────────────────────────────

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
