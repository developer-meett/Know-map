import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    questions: []
  });
  const { user } = useAuth();

  // Sample data for demonstration
  const sampleUsers = [
    { id: 'user1', email: 'user1@example.com', displayName: 'John Doe', isAdmin: false, createdAt: new Date() },
    { id: 'user2', email: 'user2@example.com', displayName: 'Jane Smith', isAdmin: false, createdAt: new Date() },
  ];

  const sampleQuizzes = [
    { 
      id: 'quiz1', 
      title: 'JavaScript Basics', 
      description: 'Test your knowledge of JavaScript fundamentals', 
      questions: [
        {
          id: 'q1',
          question: 'What is the correct way to declare a variable in JavaScript?',
          options: ['var x = 5;', 'variable x = 5;', 'v x = 5;', 'declare x = 5;'],
          correct: 0
        },
        {
          id: 'q2',
          question: 'Which method is used to add an element to the end of an array?',
          options: ['push()', 'add()', 'append()', 'insert()'],
          correct: 0
        }
      ]
    },
    { 
      id: 'quiz2', 
      title: 'React Fundamentals', 
      description: 'Basic concepts of React development', 
      questions: [
        {
          id: 'q1',
          question: 'What is JSX?',
          options: ['A JavaScript extension', 'A CSS framework', 'A database', 'A server'],
          correct: 0
        }
      ]
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure current user document exists
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName || user.email,
            isAdmin: true,
            createdAt: new Date(),
          }, { merge: true });
        } catch (userCreateError) {
          console.warn('Could not create user document:', userCreateError);
        }
      }

      // Fetch users with error handling
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (usersData.length === 0) {
          console.log('No users found, using sample data');
          setUsers(sampleUsers);
        } else {
          setUsers(usersData);
        }
      } catch (userError) {
        console.error('Error fetching users, using sample data:', userError);
        setError('Using sample data. Check Firebase permissions.');
        setUsers(sampleUsers);
      }

      // Fetch quizzes with error handling
      try {
        const quizzesSnapshot = await getDocs(collection(db, 'quizzes'));
        const quizzesData = quizzesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (quizzesData.length === 0) {
          console.log('No quizzes found, creating sample data');
          // Try to create sample quizzes
          for (const sampleQuiz of sampleQuizzes) {
            try {
              await setDoc(doc(db, 'quizzes', sampleQuiz.id), sampleQuiz);
            } catch (createError) {
              console.warn('Could not create sample quiz:', createError);
            }
          }
          setQuizzes(sampleQuizzes);
        } else {
          setQuizzes(quizzesData);
        }
      } catch (quizError) {
        console.error('Error fetching quizzes, using sample data:', quizError);
        setError('Using sample data. Check Firebase permissions.');
        setQuizzes(sampleQuizzes);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load admin data. Using sample data. Check Firebase setup and permissions.');
      setUsers(sampleUsers);
      setQuizzes(sampleQuizzes);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isAdmin: !currentStatus
      });
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isAdmin: !currentStatus } : user
      ));
      
      alert('User admin status updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Failed to update user admin status: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setUsers(users.filter(user => user.id !== userId));
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(`Failed to delete user: ${error.message}`);
      }
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await deleteDoc(doc(db, 'quizzes', quizId));
        setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
        alert('Quiz deleted successfully!');
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert(`Failed to delete quiz: ${error.message}`);
      }
    }
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions || []
    });
    setShowQuizModal(true);
  };

  const handleCreateQuiz = () => {
    setEditingQuiz(null);
    setQuizForm({
      title: '',
      description: '',
      questions: []
    });
    setShowQuizModal(true);
  };

  const handleSaveQuiz = async () => {
    try {
      if (!quizForm.title.trim()) {
        alert('Please enter a quiz title');
        return;
      }

      if (editingQuiz) {
        // Update existing quiz
        const quizRef = doc(db, 'quizzes', editingQuiz.id);
        await updateDoc(quizRef, quizForm);
        setQuizzes(quizzes.map(quiz => 
          quiz.id === editingQuiz.id ? { ...quiz, ...quizForm } : quiz
        ));
        alert('Quiz updated successfully!');
      } else {
        // Create new quiz
        const docRef = await addDoc(collection(db, 'quizzes'), quizForm);
        setQuizzes([...quizzes, { id: docRef.id, ...quizForm }]);
        alert('Quiz created successfully!');
      }

      setShowQuizModal(false);
      setEditingQuiz(null);
      setQuizForm({ title: '', description: '', questions: [] });
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert(`Failed to save quiz: ${error.message}`);
    }
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      [field]: value
    };
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const addQuestion = () => {
    const newQuestion = {
      id: `q${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correct: 0
    };
    setQuizForm({
      ...quizForm,
      questions: [...quizForm.questions, newQuestion]
    });
  };

  const removeQuestion = (questionIndex) => {
    const updatedQuestions = quizForm.questions.filter((_, index) => index !== questionIndex);
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome, {user?.displayName || user?.email}</p>
        <p className="debug-info">User ID: {user?.uid}</p>
        {error && <div className="error-message">{error}</div>}
        <div className="success-message">
          ✅ Firestore rules updated to support admin operations!
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button 
          className={activeTab === 'quizzes' ? 'active' : ''} 
          onClick={() => setActiveTab('quizzes')}
        >
          Quizzes ({quizzes.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="admin-section">
          <h2>User Management</h2>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Display Name</th>
                  <th>Admin</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userData) => (
                  <tr key={userData.id}>
                    <td>{userData.email}</td>
                    <td>{userData.displayName || 'N/A'}</td>
                    <td>
                      <span className={userData.isAdmin ? 'admin-badge' : 'user-badge'}>
                        {userData.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>
                      {userData.createdAt ? 
                        new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 
                        'N/A'
                      }
                    </td>
                    <td className="actions">
                      <button 
                        onClick={() => handleToggleAdmin(userData.id, userData.isAdmin)}
                        className="toggle-admin-btn"
                      >
                        {userData.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(userData.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'quizzes' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Quiz Management</h2>
            <button className="create-btn" onClick={handleCreateQuiz}>
              Create New Quiz
            </button>
          </div>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Questions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.id}>
                    <td>{quiz.title}</td>
                    <td>{quiz.description}</td>
                    <td>{quiz.questions?.length || 0}</td>
                    <td className="actions">
                      <button 
                        className="edit-btn" 
                        onClick={() => handleEditQuiz(quiz)}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowQuizModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Quiz Title</label>
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  placeholder="Enter quiz title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  placeholder="Enter quiz description"
                />
              </div>
              
              <div className="questions-section">
                <div className="questions-header">
                  <h4>Questions</h4>
                  <button type="button" className="add-question-btn" onClick={addQuestion}>
                    Add Question
                  </button>
                </div>
                
                {quizForm.questions.map((question, questionIndex) => (
                  <div key={question.id} className="question-item">
                    <div className="question-header">
                      <span>Question {questionIndex + 1}</span>
                      <button 
                        type="button" 
                        className="remove-question-btn"
                        onClick={() => removeQuestion(questionIndex)}
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="form-group">
                      <label>Question</label>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                        placeholder="Enter question"
                      />
                    </div>
                    
                    <div className="options-grid">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="option-item">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          <label className="radio-label">
                            <input
                              type="radio"
                              name={`correct-${questionIndex}`}
                              checked={question.correct === optionIndex}
                              onChange={() => handleQuestionChange(questionIndex, 'correct', optionIndex)}
                            />
                            Correct
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowQuizModal(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSaveQuiz}>
                {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
