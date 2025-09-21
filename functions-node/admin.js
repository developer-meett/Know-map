const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
initializeApp();
const admin = getAuth();
const db = getFirestore();

/**
 * Cloud Function to set admin role for a user
 * This function can only be called by existing admins
 */
exports.setAdminRole = onCall(async (request) => {
  const { email, role } = request.data;
  const context = request;

  // Check if the caller is authenticated
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to call this function.');
  }

  try {
    // Get the caller's custom claims to check if they're an admin
    const callerRecord = await admin.getUser(context.auth.uid);
    const callerClaims = callerRecord.customClaims || {};

    // Only allow existing admins to set roles (except for the initial setup)
    if (!callerClaims.admin) {
      // Special case: if there are no admins in the system yet, allow the first user to become admin
      const adminUsersSnapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();
      
      if (!adminUsersSnapshot.empty) {
        throw new HttpsError('permission-denied', 'Only admins can assign roles.');
      }
      
      console.log('No admins found in system. Allowing first admin creation.');
    }

    // Validate input
    if (!email || !role) {
      throw new HttpsError('invalid-argument', 'Email and role are required.');
    }

    if (!['admin', 'student'].includes(role)) {
      throw new HttpsError('invalid-argument', 'Role must be either "admin" or "student".');
    }

    // Get the target user by email
    let targetUser;
    try {
      targetUser = await admin.getUserByEmail(email);
    } catch (error) {
      throw new HttpsError('not-found', `User with email ${email} not found.`);
    }

    // Set custom claims
    const customClaims = {
      admin: role === 'admin'
    };
    
    await admin.setCustomUserClaims(targetUser.uid, customClaims);

    // Update the user document in Firestore
    const userRef = db.collection('users').doc(targetUser.uid);
    await userRef.set({
      email: targetUser.email,
      role: role,
      updatedAt: new Date(),
      updatedBy: context.auth.uid
    }, { merge: true });

    console.log(`Successfully set role "${role}" for user ${email} (${targetUser.uid})`);
    
    return {
      success: true,
      message: `Successfully set role "${role}" for user ${email}`,
      uid: targetUser.uid
    };

  } catch (error) {
    console.error('Error in setAdminRole function:', error);
    
    // Re-throw HttpsError as-is
    if (error instanceof HttpsError) {
      throw error;
    }
    
    // Convert other errors to HttpsError
    throw new HttpsError('internal', 'An internal error occurred while setting the admin role.');
  }
});

/**
 * Cloud Function to get user's custom claims
 * Useful for debugging and verification
 */
exports.getUserClaims = onCall(async (request) => {
  const context = request;

  // Check if the caller is authenticated
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to call this function.');
  }

  try {
    const userRecord = await admin.getUser(context.auth.uid);
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      customClaims: userRecord.customClaims || {},
      emailVerified: userRecord.emailVerified
    };
  } catch (error) {
    console.error('Error getting user claims:', error);
    throw new HttpsError('internal', 'An error occurred while getting user claims.');
  }
});
