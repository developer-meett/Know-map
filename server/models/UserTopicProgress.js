import mongoose from 'mongoose';

const { Schema } = mongoose;

const userTopicProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, default: 'General' },
    topic: { type: String, required: true },
    subtopic: { type: String, required: true },
    score: { type: Number, required: true }, // percentage
    classification: { type: String, enum: ['Mastered', 'Needs Revision', 'Learn from Scratch'], required: true },
    confidence: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    questionsAnswered: { type: Number, default: 0 },
    quizAttemptId: { type: Schema.Types.ObjectId, ref: 'QuizAttempt' },
  },
  { timestamps: true }
);

userTopicProgressSchema.index({ userId: 1, topic: 1, subtopic: 1, createdAt: -1 });

const UserTopicProgress = mongoose.model('UserTopicProgress', userTopicProgressSchema);
export default UserTopicProgress;
