import mongoose from 'mongoose';

const { Schema } = mongoose;

const userQuestionHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: String, required: true },
    answeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userQuestionHistorySchema.index({ userId: 1, questionId: 1 });
userQuestionHistorySchema.index({ userId: 1, answeredAt: -1 });

const UserQuestionHistory = mongoose.model('UserQuestionHistory', userQuestionHistorySchema);
export default UserQuestionHistory;
