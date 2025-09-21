const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function to set admin role for a user
 * Only callable by authenticated users with admin privileges
 */
exports.setAdminRole = onCall(async (request) => {
  // Verify the user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid, isAdmin } = request.data;

  // Validate input
  if (!uid || typeof isAdmin !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Invalid parameters. Provide uid and isAdmin (boolean)');
  }

  try {
    // Set custom claims
    const customClaims = { admin: isAdmin };
    
    await admin.auth().setCustomUserClaims(uid, customClaims);
    
    // Update Firestore user document
    const userRef = admin.firestore().collection('users').doc(uid);
    await userRef.update({
      role: isAdmin ? 'admin' : 'student',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: request.auth.uid
    });

    logger.info(`Admin role ${isAdmin ? 'granted' : 'revoked'} for user ${uid} by ${request.auth.uid}`);

    return {
      success: true,
      message: `Admin role ${isAdmin ? 'granted' : 'revoked'} successfully`,
      uid: uid,
      isAdmin: isAdmin
    };

  } catch (error) {
    logger.error('Error setting admin role:', error);
    throw new HttpsError('internal', 'Failed to set admin role: ' + error.message);
  }
});

/**
 * Cloud Function to get user claims
 * Useful for debugging and verification
 */
exports.getUserClaims = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = request.data;
  const targetUid = uid || request.auth.uid;

  try {
    const userRecord = await admin.auth().getUser(targetUid);
    
    return {
      success: true,
      uid: targetUid,
      claims: userRecord.customClaims || {},
      email: userRecord.email
    };

  } catch (error) {
    logger.error('Error getting user claims:', error);
    throw new HttpsError('internal', 'Failed to get user claims: ' + error.message);
  }
});
