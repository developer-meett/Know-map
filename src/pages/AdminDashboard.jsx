import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';
import QuizJSONValidator from '../utils/jsonValidator';
import { setAdminRole, deleteUser } from '../utils/adminUtils';
import { RefreshCw } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmationModal from '../components/ConfirmationModal';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [adminUsers, setAdminUsers] = useState(new Set()); // Track users with admin claims
  
  // Confirmation modal states
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: null,
    isLoading: false
  });
  
  // Bulk upload states
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(''); // 'uploading', 'validating', 'saving', 'complete', 'error'
  const [validationResult, setValidationResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // Store the actual file
  const [fileData, setFileData] = useState(null); // Store parsed JSON data
  const [isImporting, setIsImporting] = useState(false); // Track import process
  
  // Use ref to track cancellation state for reliable checking in async operations
  const importCancelledRef = useRef(false);
  
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    questions: []
  });
  const { user } = useAuth();

  // Helper function to format dates
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      
      // Handle regular Date object
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      
      // Handle timestamp (seconds)
      if (typeof date === 'number') {
        return new Date(date * 1000).toLocaleDateString();
      }
      
      // Handle string date
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString();
      }
      
      // Handle object with seconds property (Firestore timestamp)
      if (date.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString();
      }
      
      return 'Invalid Date';
    } catch (error) {
      console.error('Date formatting error:', error, 'Date:', date);
      return 'Invalid Date';
    }
  };

  // Helper function to check if a user is admin
  const isUserAdmin = (userData) => {
    // Check if user has been granted admin via Firebase Function
    if (adminUsers.has(userData.id)) {
      return true;
    }
    
    // Check isAdmin field in Firestore
    return userData.isAdmin === true;
  };

  // Helper functions for confirmation modal
  const showConfirmation = (title, message, type, onConfirm) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      isLoading: false
    });
  };

  const closeConfirmation = () => {
    setConfirmationModal({
      isOpen: false,
      title: '',
      message: '',
      type: 'warning',
      onConfirm: null,
      isLoading: false
    });
  };

  const handleConfirm = async () => {
    if (confirmationModal.onConfirm) {
      setConfirmationModal(prev => ({ ...prev, isLoading: true }));
      try {
        await confirmationModal.onConfirm();
        closeConfirmation();
      } catch (error) {
        setConfirmationModal(prev => ({ ...prev, isLoading: false }));
        throw error; // Re-throw to be handled by the calling function
      }
    }
  };

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
    
    // If current user is admin (since they can access this page), add them to admin set
    if (user) {
      setAdminUsers(prev => new Set([...prev, user.uid]));
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users with error handling
      try {
        console.log('📊 AdminDashboard: Fetching users from Firestore...');
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Raw user data:', data); // Debug log
          
          return {
            id: doc.id,
            ...data,
            // Ensure date fields are properly formatted
            createdAt: data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : new Date()),
            lastLoginAt: data.lastLoginAt?.toDate?.() || (data.lastLoginAt ? new Date(data.lastLoginAt) : new Date()),
          };
        });
        
        console.log(`📊 AdminDashboard: Found ${usersData.length} users:`, usersData);
        
        if (usersData.length === 0) {
          console.log('⚠️ No users found in Firestore, using sample data');
          setUsers(sampleUsers);
        } else {
          setUsers(usersData);
        }
      } catch (userError) {
        console.error('💥 Error fetching users, using sample data:', userError);
        setError('Error loading users from database. Showing sample data.');
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
      console.log("🔐 Toggling admin status for user:", userId, "Current status:", currentStatus);
      
      // Find the user to get their email/UID
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        throw new Error('User not found');
      }
      
      console.log("👤 User to update:", userToUpdate.email);
      
      // IMPORTANT: Call the Firebase Function to set custom claims
      // This is what actually grants/revokes admin access
      console.log("📞 Calling setAdminRole function...");
      const result = await setAdminRole({
        uid: userId,
        isAdmin: !currentStatus
      });
      
      console.log("✅ setAdminRole result:", result);
      
      // Track this user as admin in our local state
      if (!currentStatus) {
        setAdminUsers(prev => new Set([...prev, userId]));
      } else {
        setAdminUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
      
      // Also update Firestore for the admin panel display
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isAdmin: !currentStatus
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isAdmin: !currentStatus } : user
      ));
      
      console.log("🎉 Admin status updated successfully!");
      
      // Show success toast
      toast.success(
        `User admin status updated successfully! ${userToUpdate.email} is now ${!currentStatus ? 'an admin' : 'not an admin'}.`,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      
    } catch (error) {
      console.error('💥 Error updating user admin status:', error);
      
      // Show error toast
      toast.error(`Failed to update user admin status: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    const userEmail = userToDelete?.email || 'Unknown User';
    
    showConfirmation(
      'Delete User',
      `Are you sure you want to delete "${userEmail}"? This will permanently remove them from Firebase Auth and all their data. This action cannot be undone.`,
      'danger',
      async () => {
        try {
          console.log("🗑️ Deleting user:", userId);
          
          // Call Firebase Function to delete from both Auth and Firestore
          const result = await deleteUser({ uid: userId });
          
          console.log("✅ User deletion result:", result);
          
          // Update local state to remove the user
          setUsers(users.filter(user => user.id !== userId));
          
          // Show success toast
          toast.success(`User "${userEmail}" deleted successfully from both authentication and database!`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          
        } catch (error) {
          console.error('💥 Error deleting user:', error);
          
          // Show error toast
          toast.error(`Failed to delete user: ${error.message}`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          
          throw error; // Re-throw to be handled by the modal
        }
      }
    );
  };

  const handleDeleteQuiz = async (quizId) => {
    const quizToDelete = quizzes.find(q => q.id === quizId);
    const quizTitle = quizToDelete?.title || 'Unknown Quiz';
    
    showConfirmation(
      'Delete Quiz',
      `Are you sure you want to delete "${quizTitle}"? This action cannot be undone.`,
      'danger',
      async () => {
        try {
          await deleteDoc(doc(db, 'quizzes', quizId));
          setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
          
          // Show success toast
          toast.success(`Quiz "${quizTitle}" deleted successfully!`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          
        } catch (error) {
          console.error('Error deleting quiz:', error);
          
          // Show error toast
          toast.error(`Failed to delete quiz: ${error.message}`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          
          throw error; // Re-throw to be handled by the modal
        }
      }
    );
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions || []
    });
    setSuccessMessage(''); // Clear any existing messages
    setShowQuizModal(true);
  };

  const handleCreateQuiz = () => {
    setEditingQuiz(null);
    setQuizForm({
      title: '',
      description: '',
      questions: []
    });
    setSuccessMessage(''); // Clear any existing messages
    setShowQuizModal(true);
  };

  const closeQuizModal = () => {
    setShowQuizModal(false);
    setSuccessMessage(''); // Clear success message when closing modal
    setEditingQuiz(null);
  };

  const handleSaveQuiz = async () => {
    try {
      if (!quizForm.title.trim()) {
        toast.error('Please enter a quiz title', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      if (editingQuiz) {
        // Update existing quiz
        const quizRef = doc(db, 'quizzes', editingQuiz.id);
        await updateDoc(quizRef, quizForm);
        setQuizzes(quizzes.map(quiz => 
          quiz.id === editingQuiz.id ? { ...quiz, ...quizForm } : quiz
        ));
        
        toast.success('Quiz updated successfully!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        // Create new quiz
        const docRef = await addDoc(collection(db, 'quizzes'), quizForm);
        setQuizzes([...quizzes, { id: docRef.id, ...quizForm }]);
        
        toast.success('Quiz created successfully!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }

      setShowQuizModal(false);
      setEditingQuiz(null);
      setSuccessMessage(''); // Clear success message after saving
      setQuizForm({ title: '', description: '', questions: [] });
    } catch (error) {
      console.error('Error saving quiz:', error);
      
      toast.error(`Failed to save quiz: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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
      correct: 0,
      topic: ''
    };
    setQuizForm({
      ...quizForm,
      questions: [...quizForm.questions, newQuestion]
    });
    
    // Show success toast
    toast.success('Question added successfully! Scroll down to see the new question.', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const removeQuestion = (questionIndex) => {
    const question = quizForm.questions[questionIndex];
    const questionText = question?.question || `Question ${questionIndex + 1}`;
    
    showConfirmation(
      'Remove Question',
      `Are you sure you want to remove "${questionText}"? This action cannot be undone.`,
      'warning',
      () => {
        const updatedQuestions = quizForm.questions.filter((_, index) => index !== questionIndex);
        setQuizForm({ ...quizForm, questions: updatedQuestions });
        
        toast.success('Question removed successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    );
  };

  // Bulk Upload Functions
  const handleFileSelect = (file) => {
    if (!file) return;
    
    console.log('📁 File selected:', file.name, 'Size:', file.size);
    
    // Reset states
    setValidationResult(null);
    setUploadStatus('');
    setUploadProgress(0);
    setSelectedFile(file); // Store the file
    
    // Validate file first
    const fileValidation = QuizJSONValidator.validateFile(file);
    if (!fileValidation.isValid) {
      setValidationResult({
        isValid: false,
        errors: fileValidation.errors,
        warnings: [],
        summary: 'File validation failed'
      });
      return;
    }
    
    // Read and parse JSON
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setUploadStatus('validating');
        setUploadProgress(25);
        
        console.log('📖 Parsing JSON data...');
        const jsonData = JSON.parse(e.target.result);
        console.log('✅ JSON parsed successfully:', {
          title: jsonData.title,
          questionCount: jsonData.questions?.length || 0
        });
        
        // Store the parsed data
        setFileData(jsonData);
        
        const validation = QuizJSONValidator.validateQuizJSON(jsonData);
        
        setValidationResult(validation);
        setUploadProgress(50);
        
        if (validation.isValid) {
          setUploadStatus('ready');
          setUploadProgress(100);
          console.log('✅ File validation complete - ready to import');
        } else {
          setUploadStatus('error');
          console.log('❌ Validation failed:', validation.errors);
        }
        
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError);
        setValidationResult({
          isValid: false,
          errors: [`Invalid JSON format: ${parseError.message}`],
          warnings: [],
          summary: 'JSON parsing failed'
        });
        setUploadStatus('error');
      }
    };
    
    reader.onerror = (error) => {
      console.error('❌ File reading error:', error);
      setUploadStatus('error');
      setValidationResult({
        isValid: false,
        errors: ['Failed to read file'],
        warnings: [],
        summary: 'File reading failed'
      });
    };
    
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBulkImportAsQuiz = async () => {
    if (!fileData) {
      console.error('❌ No file data available for import');
      alert('Please select and validate a file first');
      return;
    }
    
    console.log('🔄 Starting bulk import as quiz...');
    console.log('📊 Import data:', {
      title: fileData.title,
      topic: fileData.topic,
      questionCount: fileData.questions?.length || 0
    });
    
    // Reset cancellation flag
    importCancelledRef.current = false;
    setIsImporting(true);
    setUploadStatus('importing');
    setUploadProgress(0);
    
    try {
      const questions = fileData.questions;
      const total = questions.length;
      
      console.log(`📝 Creating quiz with ${total} questions...`);
      
      // Create quiz document with all questions
      const quizData = {
        title: fileData.title || 'Imported Quiz',
        description: fileData.description || `Quiz imported from JSON with ${total} questions`,
        topic: fileData.topic || 'General',
        questions: questions.map((q, index) => ({
          id: `q${index + 1}`,
          question: q.question,
          options: q.options,
          correct: q.correct,
          topic: q.topic || fileData.topic || 'General'
        })),
        createdAt: Timestamp.now(),
        createdBy: user.uid,
        isImported: true
      };
      
      setUploadProgress(50);
      
      console.log('📤 Saving quiz to Firestore...');
      const docRef = await addDoc(collection(db, 'quizzes'), quizData);
      
      console.log('✅ Quiz created with ID:', docRef.id);
      
      // Update local quizzes state
      setQuizzes(prevQuizzes => [...prevQuizzes, { id: docRef.id, ...quizData }]);
      
      setUploadProgress(100);
      
      console.log('🎉 Bulk import completed!');
      console.log(`📊 Successfully created quiz: "${quizData.title}" with ${total} questions`);
      
      setUploadStatus('completed');
      setValidationResult({
        isValid: true,
        errors: [],
        warnings: [],
        summary: `Successfully created quiz "${quizData.title}" with ${total} questions`
      });
      
    } catch (error) {
      console.error('💥 Bulk import error:', error);
      setUploadStatus('error');
      setValidationResult({
        isValid: false,
        errors: [`Import failed: ${error.message}`],
        warnings: [],
        summary: 'Bulk import failed'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleBulkImport = async () => {
    if (!fileData) {
      console.error('❌ No file data available for import');
      alert('Please select and validate a file first');
      return;
    }
    
    console.log('� Starting bulk import...');
    console.log('📊 Import data:', {
      title: fileData.title,
      topic: fileData.topic,
      questionCount: fileData.questions?.length || 0,
      firstQuestion: fileData.questions?.[0]?.question?.substring(0, 50) + '...'
    });
    
    // Reset cancellation flag
    importCancelledRef.current = false;
    setIsImporting(true);
    setUploadStatus('importing');
    setUploadProgress(0);
    
    try {
      const questions = fileData.questions;
      const total = questions.length;
      let imported = 0;
      let skipped = 0;
      
      console.log(`📝 Processing ${total} questions...`);
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        console.error('⏰ Import timeout after 30 seconds');
        importCancelledRef.current = true;
        setUploadStatus('error');
        setValidationResult({
          isValid: false,
          errors: ['Import timeout - please try again or contact support'],
          warnings: [],
          summary: 'Import timed out'
        });
        setIsImporting(false);
      }, 30000);
      
      // Process in batches to avoid overwhelming Firebase
      const batchSize = 5;
      for (let i = 0; i < questions.length; i += batchSize) {
        // Check cancellation using ref (more reliable than state)
        if (importCancelledRef.current) {
          console.log('🛑 Import cancelled by user');
          clearTimeout(timeoutId);
          return;
        }
        
        const batch = questions.slice(i, i + batchSize);
        console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(questions.length/batchSize)}`);
        
        await Promise.all(batch.map(async (questionData) => {
          try {
            console.log(`➕ Adding question: ${questionData.question.substring(0, 30)}...`);
            await addDoc(collection(db, 'questions'), {
              question: questionData.question,
              options: questionData.options,
              correct: questionData.correct,
              topic: questionData.topic || fileData.topic || 'General',
              createdAt: Timestamp.now(),
              createdBy: user.uid
            });
            imported++;
            console.log(`✅ Question added successfully (${imported}/${total})`);
          } catch (error) {
            console.error('❌ Error adding question:', error);
            skipped++;
          }
        }));
        
        // Update progress
        const progress = Math.round(((i + batch.length) / total) * 100);
        setUploadProgress(progress);
        console.log(`📈 Progress: ${progress}% (${imported} imported, ${skipped} skipped)`);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      clearTimeout(timeoutId);
      
      console.log('🎉 Bulk import completed!');
      console.log(`📊 Final results: ${imported} imported, ${skipped} skipped`);
      
      setUploadStatus('completed');
      setValidationResult({
        isValid: true,
        errors: [],
        warnings: skipped > 0 ? [`${skipped} questions were skipped due to errors`] : [],
        summary: `Successfully imported ${imported} out of ${total} questions`
      });
      
      // Note: Individual questions are now in the 'questions' collection
      // You can refresh the admin dashboard to see them
      
    } catch (error) {
      console.error('💥 Bulk import error:', error);
      setUploadStatus('error');
      setValidationResult({
        isValid: false,
        errors: [`Import failed: ${error.message}`],
        warnings: [],
        summary: 'Bulk import failed'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const cancelImport = () => {
    console.log('🛑 User cancelled import');
    importCancelledRef.current = true;
    setIsImporting(false);
    setUploadStatus('cancelled');
    setValidationResult({
      isValid: false,
      errors: ['Import cancelled by user'],
      warnings: [],
      summary: 'Import was cancelled'
    });
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/sample-quiz-template.json';
    link.download = 'quiz-template.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <p><b>Welcome, {user?.displayName || user?.email}</b></p>
        {/* <p className="debug-info">User ID: {user?.uid}</p>
        {error && <div className="error-message">{error}</div>}
        <div className="success-message">
          ✅ Firestore rules updated to support admin operations!
        </div> */}
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
          <div className="section-header">
            <h2>User Management</h2>
            <button 
              className="refresh-button" 
              onClick={fetchData}
              disabled={loading}
              title="Refresh user list"
            >
              <RefreshCw className={`refresh-icon ${loading ? 'icon-spin' : ''}`} size={16} />
              Refresh
            </button>
          </div>
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
                      <span className={isUserAdmin(userData) ? 'admin-badge' : 'user-badge'}>
                        {isUserAdmin(userData) ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>
                      {formatDate(userData.createdAt)}
                    </td>
                    <td className="actions">
                      <button 
                        onClick={() => handleToggleAdmin(userData.id, isUserAdmin(userData))}
                        className="btn btn-sm btn-outline-primary"
                      >
                        {isUserAdmin(userData) ? 'Remove Admin' : 'Make Admin'}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(userData.id)}
                        className="btn btn-sm btn-danger"
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
            <div className="quiz-actions">
              <button className="btn btn-primary btn-sm" onClick={handleCreateQuiz}>
                Create New Quiz
              </button>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => setShowBulkUpload(!showBulkUpload)}
              >
                {showBulkUpload ? 'Hide' : 'Bulk Upload'}
              </button>
            </div>
          </div>

          {/* Bulk Upload Section */}
          {showBulkUpload && (
            <div className="bulk-upload-section">
              <h3>Bulk Upload Questions</h3>
              <p>Upload a JSON file to import multiple questions at once.</p>
              
              <div className="upload-actions">
                <button className="btn btn-outline btn-sm" onClick={downloadTemplate}>
                  📥 Download Template
                </button>
              </div>

              {/* File Upload Area */}
              <div 
                className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="upload-content">
                  <div className="upload-icon">📄</div>
                  <p>Drag and drop your JSON file here, or</p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                    id="bulk-upload-input"
                  />
                  <label htmlFor="bulk-upload-input" className="btn btn-outline-primary btn-sm">
                    Choose File
                  </label>
                </div>
              </div>

              {/* Upload Progress */}
              {uploadStatus && (
                <div className="upload-progress-section">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">
                    {uploadStatus === 'validating' && 'Validating JSON structure...'}
                    {uploadStatus === 'ready' && 'File validated successfully!'}
                    {uploadStatus === 'saving' && 'Saving questions to database...'}
                    {uploadStatus === 'complete' && 'Import completed successfully!'}
                    {uploadStatus === 'error' && 'Import failed - check errors below'}
                  </p>
                </div>
              )}

              {/* Validation Results */}
              {validationResult && (
                <div className="validation-results">
                  <h4>Validation Results</h4>
                  <div className={`validation-summary ${validationResult.isValid ? 'valid' : 'invalid'}`}>
                    {validationResult.summary}
                  </div>

                  {validationResult.errors.length > 0 && (
                    <div className="validation-errors">
                      <h5>❌ Errors ({validationResult.errors.length}):</h5>
                      <ul>
                        {validationResult.errors.map((error, index) => (
                          <li key={index} className="error-item">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <div className="validation-warnings">
                      <h5>⚠️ Warnings ({validationResult.warnings.length}):</h5>
                      <ul>
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index} className="warning-item">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validationResult.isValid && fileData && (
                    <div className="import-actions">
                      <button 
                        className="btn btn-success"
                        onClick={handleBulkImportAsQuiz}
                        disabled={isImporting || uploadStatus === 'importing'}
                      >
                        {isImporting ? 'Importing...' : `Import ${fileData.questions?.length || 0} Questions`}
                      </button>
                      {isImporting && (
                        <button 
                          className="btn btn-outline-danger"
                          onClick={cancelImport}
                        >
                          Cancel Import
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
                        className="btn btn-sm btn-secondary" 
                        onClick={() => handleEditQuiz(quiz)}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="btn btn-sm btn-danger"
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
                className="btn btn-ghost btn-sm" 
                onClick={closeQuizModal}
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
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={addQuestion}>
                    Add Question
                  </button>
                </div>
                
                
                {quizForm.questions.map((question, questionIndex) => (
                  <div key={question.id} className="question-item">
                    <div className="question-header">
                      <span>Question {questionIndex + 1}</span>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm"
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
                    
                    <div className="form-group">
                      <label>Topic</label>
                      <input
                        type="text"
                        value={question.topic || ''}
                        onChange={(e) => handleQuestionChange(questionIndex, 'topic', e.target.value)}
                        placeholder="Enter topic (e.g., JavaScript Fundamentals, CSS Basics)"
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
              <button className="btn btn-outline-danger btn-sm" onClick={closeQuizModal}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveQuiz}>
                {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmation}
        onConfirm={handleConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        isLoading={confirmationModal.isLoading}
      />
    </div>
  );
};

export default AdminDashboard;
