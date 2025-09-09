from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import os

# --- Firebase Initialization ---
try:
    # Initialize Firebase Admin SDK
    # This will automatically use the service account credentials available in the
    # Cloud Run environment.
    firebase_admin.initialize_app()
    db = firestore.client()
    PROJECT_ID = os.environ.get('GCP_PROJECT') or os.environ.get('GCLOUD_PROJECT')
    print(f"✅ Successfully initialized Firebase Admin SDK for project: {PROJECT_ID}")
except Exception as e:
    PROJECT_ID = "Not Found"
    print(f"❌ Failed to initialize Firebase Admin SDK: {e}")
    db = None

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to confirm the server is running.
    """
    return jsonify({
        "status": "ok",
        "message": "Know-Map API is running",
        "firebase_project_id": PROJECT_ID,
        "firebase_db_status": "connected" if db else "disconnected"
    }), 200

@app.route('/submit-quiz', methods=['POST'])
def submit_quiz():
    """
    Receives quiz submissions, grades them, and returns a report.
    """
    if not db:
        return jsonify({"error": "Firestore is not connected"}), 500

    # Log the project ID for every request to be absolutely sure
    print(f"🔄 Processing /submit-quiz for project: {PROJECT_ID}")

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON payload"}), 400

        quiz_id = data.get('quizId')
        user_answers = data.get('answers')

        if not quiz_id or not user_answers:
            return jsonify({"error": "Missing quizId or answers"}), 400

        # --- Fetch Questions from Firestore ---
        questions_ref = db.collection('quizzes').document(quiz_id).collection('questions')
        questions_snapshot = questions_ref.get()

        if not questions_snapshot:
            print(f"🚫 No questions found for quiz_id: {quiz_id} in project: {PROJECT_ID}")
            return jsonify({"error": "No questions found in quiz"}), 400

        # Convert snapshot to a dictionary for easy lookup
        correct_answers = {doc.id: doc.to_dict()['correctAnswer'] for doc in questions_snapshot}
        
        if not correct_answers:
            print(f"🚫 Questions collection is empty for quiz_id: {quiz_id} in project: {PROJECT_ID}")
            return jsonify({"error": "Quiz contains no questions"}), 400

        # --- Grade the Quiz ---
        score = 0
        for question_id, user_answer in user_answers.items():
            if str(user_answer) == str(correct_answers.get(question_id)):
                score += 1
        
        total_questions = len(correct_answers)
        percentage = (score / total_questions) * 100 if total_questions > 0 else 0

        # --- Generate Report ---
        report = {
            "reportId": "some-unique-id", # Placeholder
            "quizId": quiz_id,
            "totalScore": score,
            "totalQuestions": total_questions,
            "overallPercentage": round(percentage, 2),
            "classifiedTopics": {}, # Placeholder for topic analysis
            "submittedAt": firestore.SERVER_TIMESTAMP
        }
        
        print(f"✅ Successfully graded quiz {quiz_id}. Score: {score}/{total_questions}")
        return jsonify(report), 200

    except Exception as e:
        print(f"🚨 An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)), debug=True)
