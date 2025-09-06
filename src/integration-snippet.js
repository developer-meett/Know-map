// Quick integration snippet for App.jsx
// Add these imports and update your routes

import QuizCloudFunction from './components/QuizCloudFunction';
import ResultsEnhanced from './pages/ResultsEnhanced';

// In your routing section, update to:
/*
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/quiz" element={
    <ProtectedRoute>
      <QuizCloudFunction />
    </ProtectedRoute>
  } />
  <Route path="/results-enhanced" element={
    <ProtectedRoute>
      <ResultsEnhanced />
    </ProtectedRoute>
  } />
  <Route path="/results" element={<Results />} />
</Routes>
*/

// Test the health check function
import { getFunctions, httpsCallable } from 'firebase/functions';

export const testHealthCheck = async () => {
  try {
    const functions = getFunctions();
    const healthCheck = httpsCallable(functions, 'healthCheck');
    const result = await healthCheck();
    console.log('✅ Backend health check:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    throw error;
  }
};
