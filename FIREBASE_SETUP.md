# Firebase Setup Guide for Know-Map

## Issues Identified:
1. **Missing Firebase Environment Variables** - This is the main cause of failures
2. **Firebase Project Not Configured** - Need to set up authentication methods
3. **Domain Authorization Required** - For Google Sign-in and Phone Auth

## Step-by-Step Fix:

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Enable Google Analytics (optional)
4. Wait for project creation

### 2. Enable Authentication Methods
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Google** provider:
   - Click Google → Enable → Save
3. Enable **Phone** provider:
   - Click Phone → Enable → Save

### 3. Add Web App to Firebase Project
1. In Firebase Console, click the **Web** icon (`</>`)
2. Register app with name: "Know-Map" 
3. **DO NOT** check "Firebase Hosting" (we're using Vite)
4. Copy the config object that appears

### 4. Create Environment Variables File
1. In your project root: `/Users/meetsuhagiya/Documents/Project/quiz-app/`
2. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
3. Edit `.env.local` with your Firebase config values:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyA...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

### 5. Configure Authorized Domains
1. In Firebase Console: **Authentication** → **Settings** → **Authorized domains**
2. Add these domains:
   - `localhost` (for development)
   - `127.0.0.1` (for development)
   - Your production domain (when you deploy)

### 6. Test the Setup
1. Restart your dev server:
   ```bash
   npm run dev
   ```
2. Check browser console for Firebase connection logs
3. Look for the green checkmarks in console:
   - ✅ Firebase Config Check
   - ✅ Google sign-in successful
   - ✅ OTP sent successfully

## Troubleshooting:

### Google Sign-in Issues:
- **Popup blocked**: Enable popups for localhost in browser
- **Domain not authorized**: Add localhost to Firebase authorized domains
- **API key invalid**: Double-check the API key in .env.local

### Phone OTP Issues:
- **reCAPTCHA failed**: Enable Phone provider in Firebase Console
- **Invalid phone number**: Use format: +1234567890 (with country code)
- **SMS not received**: Check Firebase usage limits/billing

### Common Errors:
- `Firebase: No Firebase App '[DEFAULT]' has been created` = Missing .env.local
- `auth/popup-closed-by-user` = User cancelled, not an error
- `auth/invalid-phone-number` = Phone format incorrect
- `auth/too-many-requests` = Rate limited, wait a few minutes

## Current Status:
- ✅ Firebase config setup with debugging
- ✅ Enhanced error logging in AuthContext
- ✅ Professional sign-in UI with Email/Google/Phone tabs
- ⚠️ **MISSING**: Firebase environment variables (.env.local file)

## Next Steps:
1. Complete Firebase setup above
2. Create .env.local file with your credentials
3. Restart dev server
4. Test all three authentication methods
5. Check browser console for success/error logs
