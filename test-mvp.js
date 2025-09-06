// Test script to verify the Know-Map MVP functionality
// Run with: node test-mvp.js

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

// You'll need to update these with your actual Firebase config
const firebaseConfig = {
  // Add your config here
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testMVP() {
  console.log('🧪 Testing Know-Map MVP...\n');

  try {
    // Test 1: Check if quiz data exists in Firestore
    console.log('1️⃣ Checking quiz data in Firestore...');
    const quizRef = collection(db, 'quizzes');
    const quizSnapshot = await getDocs(quizRef);
    
    if (quizSnapshot.empty) {
      console.log('❌ No quiz data found. Please run setupQuizData.js first.');
      return;
    }
    console.log(`✅ Found ${quizSnapshot.size} quiz questions`);

    // Test 2: Verify question structure
    console.log('\n2️⃣ Verifying question structure...');
    const firstDoc = quizSnapshot.docs[0];
    const questionData = firstDoc.data();
    
    const requiredFields = ['question', 'options', 'correctAnswer', 'topic'];
    const missingFields = requiredFields.filter(field => !(field in questionData));
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing fields in questions: ${missingFields.join(', ')}`);
      return;
    }
    console.log('✅ Question structure is correct');

    // Test 3: Check Cloud Function URL
    console.log('\n3️⃣ Checking Cloud Function configuration...');
    const functionUrl = process.env.VITE_CLOUD_FUNCTION_URL;
    
    if (!functionUrl) {
      console.log('❌ VITE_CLOUD_FUNCTION_URL not configured in .env.local');
      return;
    }
    console.log('✅ Cloud Function URL configured');

    // Test 4: Test authentication (optional - only if you have test credentials)
    console.log('\n4️⃣ Authentication test (skipped - add test credentials if needed)');
    console.log('ℹ️  You can manually test auth by signing up/in through the app');

    console.log('\n🎉 MVP test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Navigate to the quiz page');
    console.log('3. Complete a quiz to test the full flow');
    console.log('4. Deploy with: ./deploy.sh');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMVP();
