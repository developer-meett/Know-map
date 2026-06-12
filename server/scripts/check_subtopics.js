import mongoose from 'mongoose';

// Use the Atlas URI directly
const MONGO_URI = 'mongodb+srv://meetsuhagiya_db_user:ri1f4mQRdtwAjCbE@jobtracker.lxyrlv5.mongodb.net/?appName=JobTracker';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas');

  const db = mongoose.connection.db;
  const quizzes = await db.collection('quizzes').find({}).toArray();

  for (const quiz of quizzes) {
    console.log(`\n=== Quiz: "${quiz.title}" (${quiz._id}) ===`);
    console.log(`Total questions: ${quiz.questions?.length || 0}`);
    
    if (quiz.questions && quiz.questions.length > 0) {
      // Show first 5 questions with their topic/subtopic
      const sample = quiz.questions.slice(0, 5);
      sample.forEach((q, i) => {
        console.log(`  Q${i+1}: topic="${q.topic}", subtopic="${q.subtopic}", question="${q.question?.substring(0, 60)}..."`);
      });
      
      // Show ALL unique subtopics
      const subtopics = [...new Set(quiz.questions.map(q => q.subtopic || 'MISSING'))];
      console.log(`  Unique subtopics: ${JSON.stringify(subtopics)}`);
      
      // Count how many have subtopic vs not
      const withSub = quiz.questions.filter(q => q.subtopic && q.subtopic !== 'General').length;
      const withoutSub = quiz.questions.filter(q => !q.subtopic || q.subtopic === 'General').length;
      console.log(`  With real subtopic: ${withSub}, With 'General': ${withoutSub}`);
    }
  }

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
