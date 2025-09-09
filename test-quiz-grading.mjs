import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fetch from 'node-fetch';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJh8F3l21SthZ7qfR0f3zbIu6wvI2UBII",
  authDomain: "knowmap-3114.firebaseapp.com",
  projectId: "knowmap-3114",
  storageBucket: "knowmap-3114.firebasestorage.app",
  messagingSenderId: "398547896862",
  appId: "1:398547896862:web:a5c9d1b8f8e5a4c9d7a3b2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Login credentials - replace with your email/password
const email = "meetswork2004@gmail.com";
const password = "your_password_here"; // You'll need to replace this with your actual password

async function testQuizSubmission() {
  try {
    console.log('🔑 Signing in...');
    // Sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log(`✅ Signed in as ${user.email}`);
    
    // Get auth token
    const idToken = await user.getIdToken();
    console.log('✅ Got auth token');
    
    // Test data - these are the answers you said were correct
    const testAnswers = {
      "0": 1, // React is a JavaScript framework
      "1": 0, // CSS stands for Cascading Style Sheets
      "2": 2, // <h1> is the largest heading
      "3": 0, // This should be wrong to test if grading works
      "4": 0  // This should be wrong to test if grading works
    };
    
    console.log('📤 Submitting quiz with test answers:', testAnswers);
    
    // Submit to backend
    const backendUrl = "https://know-map-api-25vwxcuykq-uc.a.run.app/submitQuiz";
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        quizId: "web-development-basics",
        answers: testAnswers
      })
    });
    
    // Get response
    const responseText = await response.text();
    
    console.log(`📥 Response status: ${response.status}`);
    try {
      const responseData = JSON.parse(responseText);
      console.log('📊 Response data:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('📄 Response text:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testQuizSubmission().then(() => {
  console.log('🏁 Test complete');
  // Wait for Firebase operations to complete
  setTimeout(() => process.exit(0), 2000);
}).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
