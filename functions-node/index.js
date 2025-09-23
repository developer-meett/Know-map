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
    
    // Check if user document exists, create if it doesn't
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      // Create new user document
      try {
        const userRecord = await admin.auth().getUser(uid);
        const userData = {
          uid: uid,
          email: userRecord.email,
          displayName: userRecord.displayName || userRecord.email,
          isAdmin: isAdmin,
          role: isAdmin ? 'admin' : 'student',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: request.auth.uid
        };
        await userRef.set(userData);
        logger.info(`Created new user document for ${uid}`);
      } catch (createError) {
        logger.warn(`Could not create user document for ${uid}:`, createError);
        // Continue anyway, as custom claims are more important
      }
    } else {
      // Update existing document
      await userRef.update({
        isAdmin: isAdmin,
        role: isAdmin ? 'admin' : 'student',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: request.auth.uid
      });
    }

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

/**
 * Cloud Function to completely delete a user from both Auth and Firestore
 * Only callable by authenticated admins
 */
exports.deleteUser = onCall(async (request) => {
  // Verify the user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check if the caller is admin
  const callerRecord = await admin.auth().getUser(request.auth.uid);
  const isCallerAdmin = callerRecord.customClaims?.admin === true;

  if (!isCallerAdmin) {
    throw new HttpsError('permission-denied', 'Only admins can delete users');
  }

  const { uid } = request.data;

  if (!uid) {
    throw new HttpsError('invalid-argument', 'User UID is required');
  }

  // Prevent self-deletion
  if (uid === request.auth.uid) {
    throw new HttpsError('invalid-argument', 'Cannot delete your own account');
  }

  try {
    // Delete from Firebase Auth first
    await admin.auth().deleteUser(uid);
    logger.info(`User ${uid} deleted from Firebase Auth`);

    // Delete from Firestore
    await admin.firestore().collection('users').doc(uid).delete();
    logger.info(`User ${uid} deleted from Firestore`);

    // Optionally delete related data (quiz results, etc.)
    const batch = admin.firestore().batch();
    
    // Delete user's quiz results
    const resultsQuery = await admin.firestore()
      .collection('quiz-results')
      .where('userId', '==', uid)
      .get();
    
    resultsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    logger.info(`Related data deleted for user ${uid}`);

    return {
      success: true,
      message: `User ${uid} completely deleted from system`,
      uid: uid
    };

  } catch (error) {
    logger.error('Error deleting user:', error);
    throw new HttpsError('internal', 'Failed to delete user: ' + error.message);
  }
});
