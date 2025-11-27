const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../web/serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  const email = 'admin@example.com';
  const password = 'Admin123!';
  const role = 'admin';
  const organizationId = 'default-org';

  try {
    console.log('Creating admin user...');
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: true,
      displayName: 'Admin User'
    });

    console.log(`✓ User created in Firebase Auth with UID: ${userRecord.uid}`);

    // Set custom claims for admin role (use 'orgId' to match AuthProvider expectations)
    await auth.setCustomUserClaims(userRecord.uid, {
      role: role,
      orgId: organizationId,
      organizationId: organizationId  // Keep both for compatibility
    });

    console.log('✓ Custom claims set for admin role');

    // Create user document in Firestore (in the users collection at root level)
    const userData = {
      uid: userRecord.uid,
      email: email,
      displayName: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      role: role,
      organizationId: organizationId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: true,
      isActive: true,
      profileComplete: true
    };

    // Create in root users collection
    await db.collection('users').doc(userRecord.uid).set(userData);
    console.log('✓ User document created in Firestore (root users collection)');

    // Also create in organization-specific users subcollection
    await db.collection('organizations').doc(organizationId).collection('users').doc(userRecord.uid).set(userData);
    console.log('✓ User document created in organization users subcollection');

    // Create organization document if it doesn't exist
    const orgRef = db.collection('organizations').doc(organizationId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      await orgRef.set({
        id: organizationId,
        name: 'Default Organization',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ownerId: userRecord.uid,
        members: [userRecord.uid],
        settings: {
          maxUsers: 100,
          maxProjects: 50
        }
      });
      console.log('✓ Organization document created in Firestore');
    } else {
      console.log('✓ Organization already exists');
    }

    console.log('\n=== Admin User Created Successfully ===');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`UID: ${userRecord.uid}`);
    console.log(`Role: ${role}`);
    console.log(`Organization ID: ${organizationId}`);
    console.log('=====================================\n');

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.error('Error: User with this email already exists');
      console.log('\nAttempting to update existing user...');
      
      try {
        // Get existing user
        const existingUser = await auth.getUserByEmail(email);
        
        // Update password
        await auth.updateUser(existingUser.uid, {
          password: password,
          emailVerified: true
        });
        
        // Update custom claims
        await auth.setCustomUserClaims(existingUser.uid, {
          role: role,
          organizationId: organizationId
        });
        
        // Update Firestore document
        await db.collection('users').doc(existingUser.uid).set({
          uid: existingUser.uid,
          email: email,
          displayName: 'Admin User',
          role: role,
          organizationId: organizationId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          emailVerified: true,
          isActive: true
        }, { merge: true });
        
        console.log('\n=== Existing Admin User Updated ===');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`UID: ${existingUser.uid}`);
        console.log(`Role: ${role}`);
        console.log(`Organization ID: ${organizationId}`);
        console.log('===================================\n');
        
      } catch (updateError) {
        console.error('Error updating existing user:', updateError.message);
        process.exit(1);
      }
    } else {
      console.error('Error creating admin user:', error.message);
      process.exit(1);
    }
  } finally {
    // Clean up
    await admin.app().delete();
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });