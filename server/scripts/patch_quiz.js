/**
 * Patch script: Updates a quiz in the DB by re-importing questions from a JSON file.
 * Preserves all fields including subtopic, difficulty, weight, etc.
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use the Atlas production URI
const MONGO_URI = 'mongodb+srv://meetsuhagiya_db_user:ri1f4mQRdtwAjCbE@jobtracker.lxyrlv5.mongodb.net/?appName=JobTracker';

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('Usage: node scripts/patch_quiz.js <path-to-json-file>');
    process.exit(1);
  }

  const raw = fs.readFileSync(path.resolve(__dirname, jsonPath), 'utf-8');
  const fileData = JSON.parse(raw);

  if (!fileData.questions || !Array.isArray(fileData.questions)) {
    console.error('Invalid JSON: missing "questions" array');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas');

  const db = mongoose.connection.db;

  // Find quiz by title
  const title = fileData.title;
  const quiz = await db.collection('quizzes').findOne({ title });
  if (!quiz) {
    console.error(`No quiz found with title: "${title}"`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`\nFound quiz: "${quiz.title}" (${quiz._id})`);
  console.log(`Current questions: ${quiz.questions.length}`);
  
  // Show current subtopics (all General)
  const currentSubtopics = [...new Set(quiz.questions.map(q => q.subtopic || 'MISSING'))];
  console.log(`Current subtopics: ${JSON.stringify(currentSubtopics)}`);

  // Map the questions with ALL fields preserved
  const patchedQuestions = fileData.questions.map((q, i) => ({
    ...q,
    id: q.id || `q${i + 1}`,
    topic: q.topic || fileData.topic || 'General',
    subtopic: q.subtopic || 'General',
    difficulty: q.difficulty || 'medium',
    weight: q.weight ?? 2,
  }));

  // Show what subtopics we're writing
  const newSubtopics = [...new Set(patchedQuestions.map(q => q.subtopic))];
  console.log(`\nNew subtopics from JSON: ${JSON.stringify(newSubtopics)}`);

  // Update the quiz
  const result = await db.collection('quizzes').updateOne(
    { _id: quiz._id },
    { $set: { questions: patchedQuestions } }
  );

  console.log(`\nUpdated ${result.modifiedCount} quiz(es)`);

  // Verify
  const updated = await db.collection('quizzes').findOne({ _id: quiz._id });
  const verifiedSubtopics = [...new Set(updated.questions.map(q => q.subtopic || 'MISSING'))];
  console.log(`Verification — subtopics now in DB: ${JSON.stringify(verifiedSubtopics)}`);
  
  // Show a few samples
  updated.questions.slice(0, 5).forEach((q, i) => {
    console.log(`  Q${i+1}: topic="${q.topic}", subtopic="${q.subtopic}"`);
  });

  await mongoose.disconnect();
  console.log('\nDone! The quiz now has correct subtopics.');
}

main().catch(err => { console.error(err); process.exit(1); });
