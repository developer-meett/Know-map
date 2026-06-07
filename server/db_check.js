import mongoose from 'mongoose';
import 'dotenv/config';

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/know-map-test')
  .then(async () => {
    const Quiz = mongoose.model('Quiz', new mongoose.Schema({}, { strict: false }));
    const quizzes = await Quiz.find({}).lean();
    console.log(JSON.stringify(quizzes, null, 2));
    process.exit(0);
  });
