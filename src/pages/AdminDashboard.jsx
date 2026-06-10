import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';
import QuizJSONValidator from '../utils/jsonValidator';
import { setAdminRole, deleteUser } from '../utils/adminUtils';
import { RefreshCw } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmationModal from '../components/ConfirmationModal';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers]     = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab]     = useState('users');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz]     = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Confirmation modal states
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false, title: '', message: '', type: 'warning', onConfirm: null, isLoading: false,
  });

  // Bulk upload states
  const [showBulkUpload, setShowBulkUpload]   = useState(false);
  const [uploadProgress, setUploadProgress]   = useState(0);
  const [uploadStatus, setUploadStatus]       = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [dragActive, setDragActive]           = useState(false);
  const [selectedFile, setSelectedFile]       = useState(null);
  const [fileData, setFileData]               = useState(null);
  const [isImporting, setIsImporting]         = useState(false);

  const importCancelledRef = useRef(false);

  const [quizForm, setQuizForm] = useState({ title: '', description: '', questions: [] });

  const { user } = useAuth();

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    try { return new Date(dateValue).toLocaleDateString(); }
    catch { return 'N/A'; }
  };

  const isUserAdmin = (userData) => userData.isAdmin === true;

  // ── Confirmation modal helpers ─────────────────────────────────────────────

  const showConfirmation = (title, message, type, onConfirm) =>
    setConfirmationModal({ isOpen: true, title, message, type, onConfirm, isLoading: false });

  const closeConfirmation = () =>
    setConfirmationModal({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null, isLoading: false });

  const handleConfirm = async () => {
    if (confirmationModal.onConfirm) {
      setConfirmationModal(prev => ({ ...prev, isLoading: true }));
      try {
        await confirmationModal.onConfirm();
        closeConfirmation();
      } catch {
        setConfirmationModal(prev => ({ ...prev, isLoading: false }));
      }
    }
  };

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, quizzesRes] = await Promise.all([
        apiFetch('/admin/users'),
        apiFetch('/quizzes'),
      ]);

      setUsers(usersRes.users ?? []);
      setQuizzes(quizzesRes.quizzes ?? []);
    } catch (err) {
      setError('Failed to load admin data. Make sure the server is running.');
      toast.error(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── User actions ───────────────────────────────────────────────────────────

  const handleToggleAdmin = async (userId, currentStatus) => {
    const userToUpdate = users.find(u => (u._id ?? u.id) === userId);
    if (!userToUpdate) return;

    try {
      await setAdminRole(userId, !currentStatus);

      setUsers(prev =>
        prev.map(u =>
          (u._id ?? u.id) === userId ? { ...u, isAdmin: !currentStatus } : u
        )
      );

      toast.success(
        `${userToUpdate.email} is now ${!currentStatus ? 'an admin' : 'a regular user'}.`,
        { autoClose: 5000 }
      );
    } catch (err) {
      toast.error(`Failed to update role: ${err.message}`);
    }
  };

  const handleDeleteUser = (userId) => {
    const userToDelete = users.find(u => (u._id ?? u.id) === userId);
    const userEmail = userToDelete?.email || 'Unknown User';

    showConfirmation(
      'Delete User',
      `Are you sure you want to delete "${userEmail}"? All their quiz attempts will also be deleted. This cannot be undone.`,
      'danger',
      async () => {
        await deleteUser(userId);
        setUsers(prev => prev.filter(u => (u._id ?? u.id) !== userId));
        toast.success(`User "${userEmail}" deleted successfully.`);
      }
    );
  };

  // ── Quiz actions ───────────────────────────────────────────────────────────

  const handleDeleteQuiz = (quizId) => {
    const quizToDelete = quizzes.find(q => (q._id ?? q.id) === quizId);
    const quizTitle = quizToDelete?.title || 'Unknown Quiz';

    showConfirmation(
      'Delete Quiz',
      `Are you sure you want to delete "${quizTitle}"? This cannot be undone.`,
      'danger',
      async () => {
        await apiFetch(`/quizzes/${quizId}`, { method: 'DELETE' });
        setQuizzes(prev => prev.filter(q => (q._id ?? q.id) !== quizId));
        toast.success(`Quiz "${quizTitle}" deleted.`);
      }
    );
  };

  const handleEditQuiz = async (quiz) => {
    try {
      const qid = quiz._id ?? quiz.id;
      const { quiz: fullQuiz } = await apiFetch(`/quizzes/${qid}`);
      setEditingQuiz(fullQuiz);
      setQuizForm({ title: fullQuiz.title, description: fullQuiz.description ?? '', questions: fullQuiz.questions ?? [] });
      setSuccessMessage('');
      setShowQuizModal(true);
    } catch (err) {
      toast.error(`Failed to load quiz details: ${err.message}`);
    }
  };

  const handleCreateQuiz = () => {
    setEditingQuiz(null);
    setQuizForm({ title: '', description: '', questions: [] });
    setSuccessMessage('');
    setShowQuizModal(true);
  };

  const closeQuizModal = () => {
    setShowQuizModal(false);
    setSuccessMessage('');
    setEditingQuiz(null);
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.title.trim()) {
      toast.error('Please enter a quiz title', { autoClose: 3000 });
      return;
    }

    if (quizForm.questions.length === 0) {
      toast.error('Please add at least one question', { autoClose: 3000 });
      return;
    }

    const invalidQuestion = quizForm.questions.find(q => !q.question.trim());
    if (invalidQuestion) {
      toast.error('All questions must have question text.', { autoClose: 3000 });
      return;
    }

    const invalidOption = quizForm.questions.find(q => q.options.some(opt => !opt.trim()));
    if (invalidOption) {
      toast.error('All options must be filled out.', { autoClose: 3000 });
      return;
    }

    try {
      if (editingQuiz) {
        const quizId = editingQuiz._id ?? editingQuiz.id;
        const { quiz: updated } = await apiFetch(`/quizzes/${quizId}`, {
          method: 'PUT',
          body: JSON.stringify(quizForm),
        });
        setQuizzes(prev =>
          prev.map(q => (q._id ?? q.id) === quizId ? { ...q, ...updated } : q)
        );
        toast.success('Quiz updated successfully!');
      } else {
        const { quiz: created } = await apiFetch('/quizzes', {
          method: 'POST',
          body: JSON.stringify({ ...quizForm, isPublished: true }),
        });
        setQuizzes(prev => [created, ...prev]);
        toast.success('Quiz created successfully!');
      }

      closeQuizModal();
      setQuizForm({ title: '', description: '', questions: [] });
    } catch (err) {
      toast.error(`Failed to save quiz: ${err.message}`);
    }
  };

  // ── Question helpers (form-only, no API) ───────────────────────────────────

  const handleQuestionChange = (questionIndex, field, value) => {
    const updated = [...quizForm.questions];
    updated[questionIndex] = { ...updated[questionIndex], [field]: value };
    setQuizForm({ ...quizForm, questions: updated });
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updated = [...quizForm.questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuizForm({ ...quizForm, questions: updated });
  };

  const addQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        { id: `q${Date.now()}`, question: '', options: ['', '', '', ''], correct: 0, topic: 'General' },
      ],
    }));
    toast.success('Question added!', { autoClose: 2000 });
  };

  const removeQuestion = (questionIndex) => {
    const questionText = quizForm.questions[questionIndex]?.question || `Question ${questionIndex + 1}`;
    showConfirmation(
      'Remove Question',
      `Remove "${questionText}"?`,
      'warning',
      () => {
        setQuizForm(prev => ({
          ...prev,
          questions: prev.questions.filter((_, i) => i !== questionIndex),
        }));
        toast.success('Question removed.', { autoClose: 2000 });
      }
    );
  };

  // ── Bulk upload ────────────────────────────────────────────────────────────

  const handleFileSelect = (file) => {
    if (!file) return;

    setValidationResult(null);
    setUploadStatus('');
    setUploadProgress(0);
    setSelectedFile(file);

    const fileValidation = QuizJSONValidator.validateFile(file);
    if (!fileValidation.isValid) {
      setValidationResult({ isValid: false, errors: fileValidation.errors, warnings: [], summary: 'File validation failed' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setUploadStatus('validating');
        setUploadProgress(25);
        const jsonData = JSON.parse(e.target.result);
        setFileData(jsonData);
        const validation = QuizJSONValidator.validateQuizJSON(jsonData);
        setValidationResult(validation);
        setUploadProgress(50);
        setUploadStatus(validation.isValid ? 'ready' : 'error');
        if (validation.isValid) setUploadProgress(100);
      } catch (parseError) {
        setValidationResult({ isValid: false, errors: [`Invalid JSON: ${parseError.message}`], warnings: [], summary: 'JSON parsing failed' });
        setUploadStatus('error');
      }
    };
    reader.onerror = () => {
      setUploadStatus('error');
      setValidationResult({ isValid: false, errors: ['Failed to read file'], warnings: [], summary: 'File read error' });
    };
    reader.readAsText(file);
  };

  const handleDragOver  = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragActive(false); };
  const handleDrop      = (e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); };
  const handleFileInputChange = (e) => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); };

  const handleBulkImportAsQuiz = async () => {
    if (!fileData) { toast.error('Please select and validate a file first.'); return; }

    importCancelledRef.current = false;
    setIsImporting(true);
    setUploadStatus('importing');
    setUploadProgress(0);

    try {
      const total = fileData.questions.length;
      const quizData = {
        title:       fileData.title || 'Imported Quiz',
        description: fileData.description || `Imported quiz with ${total} questions`,
        topic:       fileData.topic || 'General',
        questions:   fileData.questions.map((q, i) => ({
          id:      `q${i + 1}`,
          question: q.question,
          options:  q.options,
          correct:  q.correct,
          topic:    q.topic || fileData.topic || 'General',
        })),
        isPublished: true,
      };

      setUploadProgress(50);
      const { quiz: created } = await apiFetch('/quizzes', {
        method: 'POST',
        body:   JSON.stringify(quizData),
      });

      setQuizzes(prev => [created, ...prev]);
      setUploadProgress(100);
      setUploadStatus('completed');
      setValidationResult({
        isValid: true, errors: [], warnings: [],
        summary: `Successfully created quiz "${quizData.title}" with ${total} questions`,
      });
      toast.success(`Quiz "${quizData.title}" imported!`);
    } catch (err) {
      setUploadStatus('error');
      setValidationResult({ isValid: false, errors: [`Import failed: ${err.message}`], warnings: [], summary: 'Import failed' });
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const cancelImport = () => {
    importCancelledRef.current = true;
    setIsImporting(false);
    setUploadStatus('cancelled');
    setValidationResult({ isValid: false, errors: ['Import cancelled by user'], warnings: [], summary: 'Cancelled' });
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/test-import.json';
    link.download = 'test-import.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="admin-dashboard page container">
        <div className="loading card">Loading admin dashboard...</div>
      </main>
    );
  }

  return (
    <main className="admin-dashboard page container">
      <div className="admin-header card">
        <h1>Admin Dashboard</h1>
        <p><b>Welcome, {user?.displayName || user?.email}</b></p>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="admin-tabs">
        <button className={activeTab === 'users'   ? 'active' : ''} onClick={() => setActiveTab('users')}>
          Users ({users.length})
        </button>
        <button className={activeTab === 'quizzes' ? 'active' : ''} onClick={() => setActiveTab('quizzes')}>
          Quizzes ({quizzes.length})
        </button>
      </div>

      <div className="admin-tab-body">

      {/* ── Users Tab ── */}
        {activeTab === 'users' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>User Management</h2>
              <button className="refresh-button" onClick={fetchData} disabled={loading} title="Refresh">
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
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userData) => {
                    const uid = userData._id ?? userData.id;
                    return (
                      <tr key={uid}>
                        <td>{userData.email}</td>
                        <td>{userData.displayName || 'N/A'}</td>
                        <td>
                          <span className={isUserAdmin(userData) ? 'admin-badge' : 'user-badge'}>
                            {isUserAdmin(userData) ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td>{formatDate(userData.createdAt)}</td>
                        <td className="actions">
                          <button
                            onClick={() => handleToggleAdmin(uid, isUserAdmin(userData))}
                            className="btn btn-sm btn-outline-primary"
                          >
                            {isUserAdmin(userData) ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(uid)}
                            className="btn btn-sm btn-danger"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* ── Quizzes Tab ── */}
      {activeTab === 'quizzes' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Quiz Management</h2>
            <div className="quiz-actions">
              <button className="btn btn-primary btn-sm" onClick={handleCreateQuiz}>
                Create New Quiz
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setShowBulkUpload(v => !v)}>
                {showBulkUpload ? 'Hide' : 'Bulk Upload'}
              </button>
            </div>
          </div>

          {/* Bulk Upload */}
          {showBulkUpload && (
            <div className="bulk-upload-section">
              <h3>Bulk Upload Questions</h3>
              <p>Upload a JSON file to import multiple questions as a quiz.</p>

              <div className="upload-actions">
                <button className="btn btn-outline btn-sm" onClick={downloadTemplate}>
                   Download Template
                </button>
              </div>

              <div
                className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="upload-content">
                  <div className="upload-icon"></div>
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

              {uploadStatus && (
                <div className="upload-progress-section">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="progress-text">
                    {uploadStatus === 'validating' && 'Validating JSON structure...'}
                    {uploadStatus === 'ready'      && 'File validated — ready to import!'}
                    {uploadStatus === 'importing'  && 'Saving quiz to database...'}
                    {uploadStatus === 'completed'  && 'Import completed successfully!'}
                    {uploadStatus === 'cancelled'  && 'Import cancelled.'}
                    {uploadStatus === 'error'      && 'Import failed — see errors below.'}
                  </p>
                </div>
              )}

              {validationResult && (
                <div className="validation-results">
                  <h4>Validation Results</h4>
                  <div className={`validation-summary ${validationResult.isValid ? 'valid' : 'invalid'}`}>
                    {validationResult.summary}
                  </div>

                  {validationResult.errors.length > 0 && (
                    <div className="validation-errors">
                      <h5> Errors ({validationResult.errors.length}):</h5>
                      <ul>{validationResult.errors.map((e, i) => <li key={i} className="error-item">{e}</li>)}</ul>
                    </div>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <div className="validation-warnings">
                      <h5>️ Warnings ({validationResult.warnings.length}):</h5>
                      <ul>{validationResult.warnings.map((w, i) => <li key={i} className="warning-item">{w}</li>)}</ul>
                    </div>
                  )}

                  {validationResult.isValid && fileData && (
                    <div className="import-actions">
                      <button
                        className="btn btn-success"
                        onClick={handleBulkImportAsQuiz}
                        disabled={isImporting}
                      >
                        {isImporting ? 'Importing...' : `Import ${fileData.questions?.length ?? 0} Questions`}
                      </button>
                      {isImporting && (
                        <button className="btn btn-outline-danger" onClick={cancelImport}>
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quiz Table */}
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
                {quizzes.map((quiz) => {
                  const qid = quiz._id ?? quiz.id;
                  return (
                    <tr key={qid}>
                      <td>{quiz.title}</td>
                      <td>{quiz.description}</td>
                      <td>{quiz.questions?.length ?? quiz.questionCount ?? 0}</td>
                      <td className="actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => handleEditQuiz(quiz)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteQuiz(qid)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}

      </div>{/* end admin-tab-body */}

      {/* ── Quiz Modal ── */}
      {showQuizModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={closeQuizModal}>×</button>
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
                  <div key={question.id ?? questionIndex} className="question-item">
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
                        placeholder="Enter question text"
                      />
                    </div>

                    <div className="form-group">
                      <label>Topic</label>
                      <input
                        type="text"
                        value={question.topic || ''}
                        onChange={(e) => handleQuestionChange(questionIndex, 'topic', e.target.value)}
                        placeholder="e.g. JavaScript, CSS, React"
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
              <button className="btn btn-outline-danger btn-sm" onClick={closeQuizModal}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveQuiz}>
                {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        draggable
        pauseOnHover
        theme="light"
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmation}
        onConfirm={handleConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        isLoading={confirmationModal.isLoading}
      />
    </main>
  );
};

export default AdminDashboard;
