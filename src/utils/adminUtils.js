import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { app } from '../firebase/config';
import { logger } from './logger';

const functions = getFunctions(app);

/**
 * Get the current user's custom claims
 */
export const getUserClaims = httpsCallable(functions, 'getUserClaims');

/**
 * Set admin role for a user (only callable by admins)
 */
export const setAdminRole = httpsCallable(functions, 'setAdminRole');

/**
 * Delete user completely from Firebase Auth and Firestore (only callable by admins)
 */
export const deleteUser = httpsCallable(functions, 'deleteUser');

/**
 * Check if the current user has admin privileges
 * @param {Object} user - Firebase Auth user object
 * @returns {Promise<boolean>} - True if user is admin
 */
export const checkIsAdmin = async (user) => {
  if (!user) {
    console.log("🚫 checkIsAdmin: No user provided");
    return false;
  }
  
  try {
    console.log("🔍 checkIsAdmin: Getting ID token for user:", user.email);
    // Get the ID token with custom claims (force refresh to get latest)
    const idTokenResult = await user.getIdTokenResult(true);
    console.log("🎫 checkIsAdmin: Token claims:", idTokenResult.claims);
    console.log("👑 checkIsAdmin: Admin claim:", idTokenResult.claims.admin);
    
    const isAdmin = !!idTokenResult.claims.admin;
    console.log("📊 checkIsAdmin: Final result:", isAdmin);
    return isAdmin;
  } catch (error) {
    console.log("💥 checkIsAdmin: Error:", error);
    logger.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Force refresh the user's ID token to get updated custom claims
 * @param {Object} user - Firebase Auth user object
 */
export const refreshUserToken = async (user) => {
  if (!user) {
    return null;
  }
  
  try {
    // Force refresh the token to get updated claims
    const idTokenResult = await user.getIdTokenResult(true);
    return idTokenResult;
  } catch (error) {
    logger.error('Error refreshing user token:', error);
    throw error;
  }
};
