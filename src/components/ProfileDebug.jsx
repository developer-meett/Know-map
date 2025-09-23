import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const ProfileDebug = () => {
  const { user } = useAuth();
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [reports, setReports] = useState([]);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      debugProfile();
    }
  }, [user]);

  const debugProfile = async () => {
    try {
      console.log('🔍 DEBUG: Checking profile data for user:', user.uid);
      
      // Check quiz-attempts collection
      const attemptsQuery = query(
        collection(db, 'quiz-attempts'),
        where('userId', '==', user.uid)
      );
      const attemptsSnapshot = await getDocs(attemptsQuery);
      const attemptsData = attemptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('🔍 Quiz attempts found:', attemptsData);
      setQuizAttempts(attemptsData);
      
      // Check reports collection
      const reportsQuery = query(
        collection(db, 'reports'),
        where('userId', '==', user.uid)
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      const reportsData = reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('🔍 Reports found:', reportsData);
      setReports(reportsData);
      
      // Check user document
      const userDoc = await import('firebase/firestore').then(({ doc, getDoc }) => 
        getDoc(doc(db, 'users', user.uid))
      );
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('🔍 User document:', userData);
        setUserDoc(userData);
      }
      
    } catch (error) {
      console.error('🔍 Debug error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading debug data...</div>;
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h2>Profile Debug Information</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>User Info</h3>
        <pre>{JSON.stringify({ uid: user.uid, email: user.email }, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>User Document</h3>
        <pre>{JSON.stringify(userDoc, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>Quiz Attempts ({quizAttempts.length})</h3>
        <pre>{JSON.stringify(quizAttempts, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>Reports ({reports.length})</h3>
        <pre>{JSON.stringify(reports, null, 2)}</pre>
      </div>
      
      <button onClick={debugProfile} style={{ padding: '0.5rem 1rem' }}>
        Refresh Debug Data
      </button>
    </div>
  );
};

export default ProfileDebug;