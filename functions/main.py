import json
import logging
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore, auth
from firebase_functions import https_fn

# Global variables for lazy initialization
db = None
logger = None

def get_firestore_client():
    """Get Firestore client with lazy initialization"""
    global db
    if db is None:
        if not firebase_admin._apps:
            # This will automatically use the project configured in the environment.
            firebase_admin.initialize_app()
            project_id = firebase_admin.get_app().project_id
            get_logger().info(f"✅ Initialized Firebase App for project: {project_id}")
        db = firestore.client()
    return db

def get_logger():
    """Get logger with lazy initialization"""
    global logger
    if logger is None:
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
    return logger

def verify_firebase_token(id_token):
    """Verify Firebase ID token and return user info"""
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        logger = get_logger()
        logger.error(f"Token verification failed: {str(e)}")
        return None

def classify_topic_performance(correct, total, threshold_mastered=0.8, threshold_needs_revision=0.5):
    
    """Classify topic performance based on score percentage"""
    if total == 0:
        return "No Questions"
    
    score_percentage = correct / total
    
    if score_percentage >= threshold_mastered:
        return "Mastered"
    elif score_percentage >= threshold_needs_revision:
        return "Needs Revision"
    else:
        return "Learn from Scratch"

def analyze_quiz_performance(user_answers, quiz_questions):
    """Analyze user performance and generate detailed topic-wise feedback"""
    try:
        # Get logger for detailed logging
        logger = get_logger()
        logger.info(f"Analyzing quiz performance with {len(quiz_questions)} questions")
        logger.info(f"User answers: {user_answers}")
        
        # Topic tracking
        topic_stats = {}
        total_score = 0
        total_questions = len(quiz_questions)
        
        # Question breakdown tracking for detailed review
        question_breakdown = []
        
        # Process each question
        for i, question in enumerate(quiz_questions):
            # Log the question structure for debugging
            logger.info(f"Processing question {i}: {question.get('question', 'Unknown question')}")
            
            # Get the user's answer for this question (could be indexed by position or question ID)
            # Try different formats for backward compatibility
            user_answer = None
            if str(i) in user_answers:
                user_answer = user_answers.get(str(i))
                logger.info(f"Found user answer using numeric index {i}: {user_answer}")
            elif question.get('id') and question.get('id') in user_answers:
                user_answer = user_answers.get(question.get('id'))
                logger.info(f"Found user answer using question id {question.get('id')}: {user_answer}")
            
            # Check multiple fields for the correct answer (for compatibility)
            correct_answer = None
            if 'correct' in question:
                correct_answer = question.get('correct')
                logger.info(f"Found correct answer in 'correct' field: {correct_answer}")
            elif 'correctAnswer' in question:
                correct_answer = question.get('correctAnswer')
                logger.info(f"Found correct answer in 'correctAnswer' field: {correct_answer}")
            else:
                logger.warning(f"No correct answer field found in question {i}")
            
            # Get topics - could be a single topic string or an array of topics
            topics_value = None
            if 'topics' in question:
                topics_value = question.get('topics')
                logger.info(f"Found topics in 'topics' field: {topics_value}")
            elif 'topic' in question:
                topics_value = question.get('topic')
                logger.info(f"Found topics in 'topic' field: {topics_value}")
            else:
                topics_value = ['General']
                logger.info("No topics field found, using default 'General'")
                
            topics = topics_value if isinstance(topics_value, list) else [topics_value]
            
            # Determine if answer is correct - Convert to same type first
            is_correct = False
            if user_answer is not None and correct_answer is not None:
                # Try to convert both to integers for comparison (handles string vs int issues)
                try:
                    user_answer_int = int(user_answer) if not isinstance(user_answer, bool) else user_answer
                    correct_answer_int = int(correct_answer) if not isinstance(correct_answer, bool) else correct_answer
                    is_correct = user_answer_int == correct_answer_int
                    logger.info(f"Comparing answer values (as int): {user_answer_int} == {correct_answer_int} => {is_correct}")
                except (ValueError, TypeError):
                    # If conversion fails, compare as strings
                    is_correct = str(user_answer).lower() == str(correct_answer).lower()
                    logger.info(f"Comparing answer values (as string): {user_answer} == {correct_answer} => {is_correct}")
            
            if is_correct:
                total_score += 1
                logger.info(f"Question {i}: CORRECT ✅")
            
            # Track performance per topic
            for topic in topics:
                if topic not in topic_stats:
                    topic_stats[topic] = {'correct': 0, 'total': 0}
                
                topic_stats[topic]['total'] += 1
                if is_correct:
                    topic_stats[topic]['correct'] += 1
            
            # Build question breakdown for detailed review
            question_breakdown.append({
                'questionId': question.get('id', f'q_{i}'),
                'questionText': question.get('question', question.get('text', 'Unknown question')),
                'topic': topics[0] if topics else 'General',  # Use first topic for display
                'userAnswer': user_answer,
                'correctAnswer': correct_answer,
                'isCorrect': is_correct,
                'options': question.get('options', [])  # Include full options array
            })
        
        # Classify topics
        classified_topics = {}
        for topic, stats in topic_stats.items():
            classification = classify_topic_performance(
                stats['correct'], 
                stats['total']
            )
            classified_topics[topic] = {
                'classification': classification,
                'correct': stats['correct'],
                'total': stats['total'],
                'percentage': round((stats['correct'] / stats['total']) * 100, 1)
            }
        
        # Overall performance
        overall_percentage = round((total_score / total_questions) * 100, 1)
        
        return {
            'totalScore': total_score,
            'totalQuestions': total_questions,
            'overallPercentage': overall_percentage,
            'classifiedTopics': classified_topics,
            'questionBreakdown': question_breakdown,
            'detailedAnswers': []  # Could be expanded for detailed answer analysis
        }
        
    except Exception as e:
        logger = get_logger()
        logger.error(f"Error in analyze_quiz_performance: {str(e)}")
        raise



# Firebase Cloud Function entry point
@https_fn.on_request()
def know_map_api(req):
    """Firebase Cloud Function entry point"""
    try:
        # Handle CORS preflight requests
        if req.method == 'OPTIONS':
            headers = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '3600'
            }
            return ('', 204, headers)
        
        # Set CORS headers for actual requests
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json'
        }
        
        # Route handling
        if req.path == '/' and req.method == 'GET':
            response_data = {
                'message': 'Know-Map API is running',
                'version': '1.0',
                'endpoints': ['/submitQuiz', '/health']
            }
            return (json.dumps(response_data), 200, headers)
        
        elif req.path == '/health' and req.method == 'GET':
            response_data = {
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'know-map-api'
            }
            return (json.dumps(response_data), 200, headers)
        
        elif req.path == '/submitQuiz' and req.method == 'POST':
            return handle_submit_quiz(req, headers)
        
        else:
            response_data = {'error': 'Not found'}
            return (json.dumps(response_data), 404, headers)
            
    except Exception as e:
        logger = get_logger()
        logger.error(f"Error in know_map_api: {str(e)}")
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        }
        response_data = {'error': 'Internal server error'}
        return (json.dumps(response_data), 500, headers)

def await_update_user_stats(db, user_id, attempt_data):
    """Update user profile statistics after quiz completion"""
    try:
        logger = get_logger()
        logger.info(f"Updating stats for user: {user_id}")
        
        # Get current user document
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            logger.warning(f"User document not found: {user_id}")
            return
        
        user_data = user_doc.to_dict()
        current_stats = user_data.get('stats', {})
        
        # Calculate new statistics
        total_quizzes = current_stats.get('totalQuizzesTaken', 0) + 1
        total_xp = current_stats.get('totalXP', 0) + attempt_data['xpEarned']
        perfect_scores = current_stats.get('perfectScores', 0) + (1 if attempt_data['isPerfectScore'] else 0)
        
        # Calculate new average score
        prev_avg = current_stats.get('averageScore', 0)
        prev_count = current_stats.get('totalQuizzesTaken', 0)
        new_avg = ((prev_avg * prev_count) + attempt_data['percentage']) / total_quizzes
        
        # Calculate level (simple: level = XP / 100)
        level = max(1, total_xp // 100)
        
        # Prepare updated stats
        updated_stats = {
            'totalQuizzesTaken': total_quizzes,
            'totalTimeSpent': current_stats.get('totalTimeSpent', 0) + (attempt_data.get('timeSpent', 0) / 60),  # Convert to minutes
            'totalXP': total_xp,
            'level': level,
            'averageScore': round(new_avg, 1),
            'perfectScores': perfect_scores
        }
        
        # Update user document
        user_ref.update({
            'stats': updated_stats,
            'lastActiveAt': attempt_data['completedAt']
        })
        
        logger.info(f"Successfully updated stats for user {user_id}: Level {level}, XP {total_xp}")
        
    except Exception as e:
        logger = get_logger()
        logger.error(f"Error updating user stats: {str(e)}")
        raise


def handle_submit_quiz(req, headers):
    """Handle quiz submission"""
    logger = get_logger()
    logger.info("--- CANARY LOG: handle_submit_quiz function entered ---")
    try:
        db = get_firestore_client()
        
        # Verify authentication
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            response_data = {'error': 'No valid authorization token provided'}
            return (json.dumps(response_data), 401, headers)
        
        id_token = auth_header.split('Bearer ')[1]
        user_info = verify_firebase_token(id_token)
        
        if not user_info:
            response_data = {'error': 'Invalid authentication token'}
            return (json.dumps(response_data), 401, headers)
        
        user_id = user_info['uid']
        logger.info(f"Processing quiz submission for user: {user_id}")
        
        # Parse request data
        request_json = req.get_json()
        if not request_json:
            response_data = {'error': 'No JSON data provided'}
            return (json.dumps(response_data), 400, headers)
        
        quiz_id = request_json.get('quizId')
        user_answers = request_json.get('answers', {})
        
        if not quiz_id:
            response_data = {'error': 'Quiz ID is required'}
            return (json.dumps(response_data), 400, headers)
        
        # Fetch quiz questions from Firestore - with detailed logging
        logger.info(f"Attempting to fetch quiz with ID: {quiz_id}")
        quiz_ref = db.collection('quizzes').document(quiz_id)
        quiz_doc = quiz_ref.get()
        
        if not quiz_doc.exists:
            logger.error(f"Quiz document {quiz_id} not found in Firestore")
            response_data = {'error': 'Quiz not found'}
            return (json.dumps(response_data), 404, headers)
        
        logger.info(f"Quiz document found with ID: {quiz_id}")
        quiz_data = quiz_doc.to_dict()
        
        # Try to get questions from the main document first (this is the new approach)
        quiz_questions = quiz_data.get('questions', [])
        logger.info(f"Found {len(quiz_questions)} questions in main document")
        
        # If no questions in main document, try the subcollection (old approach)
        if not quiz_questions:
            logger.info("No questions in main document, trying subcollection...")
            questions_collection = db.collection('quizzes').document(quiz_id).collection('questions')
            questions_docs = questions_collection.get()
            
            for doc in questions_docs:
                question_data = doc.to_dict()
                quiz_questions.append(question_data)
                
            logger.info(f"Found {len(quiz_questions)} questions in subcollection")
        
        # Log the structure of the first question for debugging
        if quiz_questions:
            logger.info(f"First question structure: {quiz_questions[0]}")
        
        if not quiz_questions:
            logger.error(f"No questions found for quiz {quiz_id} in either main document or subcollection")
            response_data = {'error': 'No questions found in quiz'}
            return (json.dumps(response_data), 400, headers)
        
        # Analyze performance
        analysis_result = analyze_quiz_performance(user_answers, quiz_questions)
        
        # Calculate additional metrics for profile tracking
        total_questions = analysis_result['totalQuestions']
        score = analysis_result['totalScore']
        percentage = analysis_result['overallPercentage']
        is_perfect_score = percentage == 100
        
        # Calculate XP earned (example: base 10 XP + bonus for high scores)
        xp_earned = 10 + (score * 2) + (50 if is_perfect_score else 0)
        
        # Get current timestamp
        submission_time = datetime.utcnow()
        
        # Create comprehensive quiz attempt record
        attempt_data = {
            'userId': user_id,
            'quizId': quiz_id,
            'quizTitle': quiz_data.get('title', 'Unknown Quiz'),
            
            # Timing
            'startedAt': submission_time,  # Frontend could provide actual start time
            'completedAt': submission_time,
            'timeSpent': request_json.get('timeSpent', 0),  # Frontend should provide this
            
            # Results
            'score': score,
            'totalQuestions': total_questions,
            'percentage': percentage,
            'isPerfectScore': is_perfect_score,
            
            # Detailed breakdown
            'topicBreakdown': analysis_result['classifiedTopics'],
            'questionBreakdown': analysis_result['questionBreakdown'],
            
            # Analytics
            'difficultyLevel': quiz_data.get('difficulty', 'medium'),
            'deviceType': request_json.get('deviceType', 'unknown'),
            'retryAttempt': 1,  # TODO: Calculate actual retry number
            
            # Gamification
            'xpEarned': xp_earned,
            'badgesUnlocked': [],  # TODO: Implement badge system
            
            # Metadata
            'userEmail': user_info.get('email', 'Unknown'),
            'reportVersion': '2.0'
        }
        
        # Save enhanced quiz attempt to new collection
        attempt_ref = db.collection('quiz-attempts').document()
        attempt_ref.set(attempt_data)
        attempt_id = attempt_ref.id
        
        # Also save to legacy reports collection for backward compatibility
        legacy_report_data = {
            'userId': user_id,
            'quizId': quiz_id,
            'submittedAt': submission_time,
            'userAnswers': user_answers,
            'analysis': analysis_result,
            'quizTitle': quiz_data.get('title', 'Unknown Quiz'),
            'userEmail': user_info.get('email', 'Unknown'),
            'reportVersion': '1.0'
        }
        
        report_ref = db.collection('reports').document()
        report_ref.set(legacy_report_data)
        report_id = report_ref.id
        
        # Update user profile statistics
        try:
            await_update_user_stats(db, user_id, attempt_data)
        except Exception as e:
            logger.warning(f"Failed to update user stats: {str(e)}")
        
        logger.info(f"Quiz attempt recorded: {attempt_id}, Legacy report: {report_id}")
        
        # Return response with both IDs
        response_data = {
            'success': True,
            'attemptId': attempt_id,
            'reportId': report_id,
            'analysis': analysis_result,
            'xpEarned': xp_earned,
            'isPerfectScore': is_perfect_score,
            'message': 'Quiz submitted and analyzed successfully'
        }
        return (json.dumps(response_data), 200, headers)
        
    except Exception as e:
        logger = get_logger()
        logger.error(f"Error in handle_submit_quiz: {str(e)}")
        response_data = {'error': 'Internal server error'}
        return (json.dumps(response_data), 500, headers)

