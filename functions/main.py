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
            firebase_admin.initialize_app()
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
        # Topic tracking
        topic_stats = {}
        total_score = 0
        total_questions = len(quiz_questions)
        
        # Process each question
        for i, question in enumerate(quiz_questions):
            user_answer = user_answers.get(str(i))
            correct_answer = question.get('correct')
            topics = question.get('topics', ['General'])
            
            # Determine if answer is correct
            is_correct = user_answer == correct_answer
            if is_correct:
                total_score += 1
            
            # Track performance per topic
            for topic in topics:
                if topic not in topic_stats:
                    topic_stats[topic] = {'correct': 0, 'total': 0}
                
                topic_stats[topic]['total'] += 1
                if is_correct:
                    topic_stats[topic]['correct'] += 1
        
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

def handle_submit_quiz(req, headers):
    """Handle quiz submission"""
    try:
        db = get_firestore_client()
        logger = get_logger()
        
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
        
        # Fetch quiz questions from Firestore
        quiz_ref = db.collection('quizzes').document(quiz_id)
        quiz_doc = quiz_ref.get()
        
        if not quiz_doc.exists:
            response_data = {'error': 'Quiz not found'}
            return (json.dumps(response_data), 404, headers)
        
        quiz_data = quiz_doc.to_dict()
        quiz_questions = quiz_data.get('questions', [])
        
        if not quiz_questions:
            response_data = {'error': 'No questions found in quiz'}
            return (json.dumps(response_data), 400, headers)
        
        # Analyze performance
        analysis_result = analyze_quiz_performance(user_answers, quiz_questions)
        
        # Create comprehensive report
        report_data = {
            'userId': user_id,
            'quizId': quiz_id,
            'submittedAt': datetime.utcnow(),
            'userAnswers': user_answers,
            'analysis': analysis_result,
            'quizTitle': quiz_data.get('title', 'Unknown Quiz'),
            'userEmail': user_info.get('email', 'Unknown'),
            'reportVersion': '1.0'
        }
        
        # Save report to Firestore
        report_ref = db.collection('reports').document()
        report_ref.set(report_data)
        report_id = report_ref.id
        
        logger.info(f"Report generated successfully: {report_id}")
        
        # Return response with report ID
        response_data = {
            'success': True,
            'reportId': report_id,
            'analysis': analysis_result,
            'message': 'Quiz submitted and analyzed successfully'
        }
        return (json.dumps(response_data), 200, headers)
        
    except Exception as e:
        logger = get_logger()
        logger.error(f"Error in handle_submit_quiz: {str(e)}")
        response_data = {'error': 'Internal server error'}
        return (json.dumps(response_data), 500, headers)

