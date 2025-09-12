import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/Results';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route 
          path="quiz" 
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="results" 
          element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="results/:reportId" 
          element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

export default App;