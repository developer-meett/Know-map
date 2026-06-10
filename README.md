# Know-Map Quiz App 
# Know-Map Quiz App 

A modern, responsive quiz application built with React, Firebase, and Vite featuring multi-method authentication and professional UI/UX.

## Features

### **Multi-Method Authentication**
- **Google Sign-In**: One-click authentication with Google accounts
- **Phone/OTP**: SMS-based verification with international phone support
- **Email/Password**: Traditional email registration and login

###  **Quiz Experience** 
###  **Quiz Experience** 
- Interactive quiz interface with real-time feedback
- Progress tracking and scoring system
- Professional results page with restart functionality

### **Security & UX**
- Protected routes (authentication required for quiz access)
- Public homepage (browse without signing in)
- Smart navigation with intended destination preservation
- Comprehensive error handling and user feedback

### **Modern Tech Stack**
- **React 19+**: Latest React with hooks and functional components
- **Firebase**: Authentication, hosting-ready configuration
- **React Router**: Client-side routing with protected routes
- **Vite**: Fast development server and build tool
- **Responsive Design**: Mobile-first, works on all devices

##  Quick Start
##  Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- Firebase project with Auth enabled

### **Installation**
```bash
# Clone and install
git clone <repository-url>
cd quiz-app
npm install

# Configure Firebase (create .env.local)
cp .env.example .env.local
# Add your Firebase configuration

# Start development server
npm run dev
```

### **Firebase Setup**
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication methods:
   - **Google**: Add your domain to authorized domains
   - **Phone**: Enable phone authentication 
   - **Email/Password**: Enable email/password authentication
3. Copy configuration to `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

##  App Structure

### **Routes**
- `/` - Public homepage (no auth required)
- `/login` - Authentication page (all methods)
- `/quiz` - Quiz interface (protected)
- `/results` - Quiz results (protected)

### **Authentication Flow**
1. Visit homepage freely without authentication
2. Click "Start Quiz" to trigger sign-in requirement
3. Choose from Google, Phone, or Email authentication
4. Complete quiz and view results
5. Automatic redirect to intended destination

##  Development

### **Project Structure**
```
src/
├── components/          # Reusable UI components
│   ├── SignIn.jsx      # Multi-method auth component
│   ├── Layout.jsx      # App layout with navbar
│   └── ProtectedRoute.jsx
├── pages/              # Route components
│   ├── HomePage/       # Landing page
│   ├── LoginPage/      # Authentication page
│   ├── QuizPage/       # Quiz interface
│   └── Results.jsx     # Results page
├── auth/              # Authentication context
│   └── AuthContext.jsx
├── firebase/          # Firebase configuration
│   └── config.js
└── questions.js       # Quiz data
```

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

##  Usage

1. **Browse Freely**: Visit the homepage without authentication
2. **Start Quiz**: Click "Start Quiz" to begin (triggers sign-in)
3. **Authenticate**: Choose your preferred sign-in method
4. **Take Quiz**: Answer questions with immediate feedback
5. **View Results**: See your score and restart if desired

##  Configuration

### **Environment Variables**
All Firebase configuration is handled through environment variables in `.env.local`. Never commit this file to version control.

### **Customization**
- **Quiz Questions**: Edit `src/questions.js`
- **Styling**: Modify `src/App.css` and component CSS files
- **Authentication**: Configure additional providers in Firebase Console

##  Dependencies

### **Core**
- React 19+ with Vite
- React Router DOM (routing)
- Firebase 12+ (authentication)

### **Development**
- ESLint (code quality)
- Vite (build tool)

##  Docker Deployment (Recommended)

The easiest way to run the full stack (Frontend, Backend, and MongoDB) locally or in production is using Docker Compose.

### **Build and Run**
```bash
docker compose up --build
```

### **Stop Containers**
```bash
docker compose down
```

### **View Logs**
```bash
docker compose logs -f
```

### **Environment Setup for Docker**
Create a `.env` file in the root directory with the following variables before running `docker compose up`:
```env
# Server Config
PORT=5001
NODE_ENV=production

# MongoDB (Use the local container for development)
MONGO_URI=mongodb://mongodb:27017/knowmap

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

##  Alternative Deployment

Ready for manual deployment to:
- **Firebase Hosting / Vercel / Netlify**: Deploy the `dist/` folder after `npm run build`
- **Backend (Render / Heroku)**: Push the `server/` directory and set `NODE_ENV=production`

##  Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- PWA-ready for app-like experience

---

**Built with ❤️ using React, Express, MongoDB, and Docker**
