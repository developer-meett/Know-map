# Firebase Authentication Troubleshooting Checklist

## Current Status: Environment Variables Fixed ✅
- ✅ .env.local file exists with correct values (no quotes)
- ✅ Development server restarted
- ✅ Enhanced error logging added

## Common Issues Still to Check:

### 1. Firebase Console - Authentication Methods
**Go to Firebase Console → Authentication → Sign-in method**

**Google Provider:**
- [ ] Google sign-in is **ENABLED**
- [ ] Web SDK configuration is **SET UP** 
- [ ] Support email is configured

**Phone Provider:**
- [ ] Phone sign-in is **ENABLED**
- [ ] Test phone numbers added (optional for testing)

### 2. Firebase Console - Authorized Domains
**Go to Firebase Console → Authentication → Settings → Authorized domains**

**Required domains for development:**
- [ ] `localhost` is added
- [ ] `127.0.0.1` is added  
- [ ] `localhost:5176` might be needed (check current port)

### 3. Browser Issues
**Chrome/Safari specific:**
- [ ] Popups are **ALLOWED** for localhost
- [ ] Third-party cookies are **ENABLED**
- [ ] Browser console shows no CORS errors
- [ ] Clear browser cache/cookies for localhost

### 4. Firebase Project Settings
**Go to Firebase Console → Project Settings → General**
- [ ] Project has a **Web App** configured
- [ ] The config values match your .env.local exactly
- [ ] Project is on **Blaze plan** (required for phone auth in production)

### 5. Common Error Codes & Solutions:

**auth/operation-not-allowed**
→ The auth method is not enabled in Firebase Console

**auth/unauthorized-domain** 
→ Add your domain to authorized domains list

**auth/popup-blocked**
→ Enable popups in browser settings

**auth/invalid-phone-number**
→ Use full international format: +1234567890

**auth/quota-exceeded**
→ Phone auth daily limits reached (check Firebase usage)

**auth/captcha-check-failed**
→ reCAPTCHA failed, refresh page and try again

## Testing Steps:
1. Open browser dev tools (F12)
2. Go to Console tab
3. Navigate to localhost:5176
4. Look for Firebase connection status in top-right corner
5. Try each auth method and check console for detailed errors

## Debug Commands:
```javascript
// Run in browser console to check Firebase status
console.log('Auth instance:', auth);
console.log('Environment vars:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
});
```

## Next Steps:
1. Check Firebase Console settings above
2. Try authentication and note the specific error codes
3. Report back with exact error messages from browser console
