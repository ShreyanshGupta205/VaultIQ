import * as admin from 'firebase-admin';

// Initialize Firebase Admin with just the project ID for verifyIdToken. 
// Standard `verifyIdToken` dynamically retrieves Google's public keys based on the Project ID.
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'vaultiq-aa861'
    });
}

export const firebaseAdmin = admin;
