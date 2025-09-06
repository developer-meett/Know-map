#!/bin/bash

# Know-Map MVP Deployment Script
echo "🚀 Deploying Know-Map MVP..."

# Step 1: Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Step 2: Check if logged in to Firebase
if ! firebase list &> /dev/null; then
    echo "🔐 Please login to Firebase first:"
    echo "   firebase login"
    exit 1
fi

# Step 3: Initialize Firebase (if not already done)
if [ ! -f "firebase.json" ]; then
    echo "📝 Initializing Firebase project..."
    firebase init
else
    echo "✅ Firebase already initialized"
fi

# Step 4: Set up quiz data in Firestore
echo "📊 Setting up quiz data in Firestore..."
node src/setupQuizData.js

# Step 5: Deploy Cloud Functions
echo "☁️  Deploying Cloud Functions..."
firebase deploy --only functions

# Step 6: Get the deployed function URL
echo "🔗 Getting function URL..."
FUNCTION_URL=$(firebase functions:config:get | grep -o 'https://[^"]*processQuizAnswers' || echo "")

if [ -n "$FUNCTION_URL" ]; then
    echo "✅ Function deployed successfully!"
    echo "   URL: $FUNCTION_URL"
    echo ""
    echo "🔧 Please update your .env.local file:"
    echo "   VITE_CLOUD_FUNCTION_URL=$FUNCTION_URL"
else
    echo "⚠️  Could not auto-detect function URL."
    echo "   Please check Firebase Console for the URL and update .env.local"
fi

# Step 7: Build frontend
echo "🏗️  Building frontend..."
npm run build

# Step 8: Deploy hosting (if configured)
if grep -q "hosting" firebase.json 2>/dev/null; then
    echo "🌐 Deploying to Firebase Hosting..."
    firebase deploy --only hosting
    echo "✅ Deployment complete!"
else
    echo "ℹ️  Firebase Hosting not configured. Frontend built successfully."
    echo "   You can serve it locally with: npm run preview"
fi

echo ""
echo "🎉 Know-Map MVP deployment complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Cloud Function URL"
echo "2. Test the quiz flow end-to-end"
echo "3. Configure Firebase Hosting if needed"
