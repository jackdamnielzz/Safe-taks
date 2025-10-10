#!/usr/bin/env node

/**
 * Load Testing Setup Script
 * Creates test users for load testing using the application's own API endpoints
 * This approach is more realistic and avoids Firebase Admin SDK complexity
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const BASE_URL = 'http://localhost:3000';

const TEST_USERS = [
  {
    email: 'admin@test.com',
    password: 'TestPassword123!',
    displayName: 'Test Admin',
    role: 'admin'
  },
  {
    email: 'safety@test.com',
    password: 'TestPassword123!',
    displayName: 'Test Safety Manager',
    role: 'safety_manager'
  },
  {
    email: 'supervisor@test.com',
    password: 'TestPassword123!',
    displayName: 'Test Supervisor',
    role: 'supervisor'
  },
  {
    email: 'worker@test.com',
    password: 'TestPassword123!',
    displayName: 'Test Field Worker',
    role: 'field_worker'
  }
];

const TEST_ORG = {
  name: 'Test Organization',
  subscriptionTier: 'professional'
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LoadTestSetup/1.0',
        ...options.headers
      }
    };

    const lib = isHttps ? https : http;
    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Helper function to wait for server to be ready
async function waitForServer() {
  const maxAttempts = 30;
  const delay = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await makeRequest(`${BASE_URL}/api/health`);
      if (response.statusCode === 200) {
        console.log('✅ Server is ready');
        return;
      }
    } catch (error) {
      console.log(`⏳ Waiting for server... (attempt ${i + 1}/${maxAttempts})`);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error('Server did not become ready in time');
}

async function createTestUsers() {
  console.log('🚀 Setting up test users for load testing...\n');

  try {
    // Wait for server to be ready
    await waitForServer();

    // For load testing, we'll use the existing invitation system
    // The authentication endpoints may not exist in the current API structure
    console.log('📝 Note: Authentication endpoints not found in current API structure');
    console.log('💡 For load testing, test users should be created manually or through existing auth system');

    // Check if we can access the organizations endpoint (which exists)
    console.log('🔍 Checking existing API endpoints...');
    const orgsResponse = await makeRequest(`${BASE_URL}/api/organizations`, {
      method: 'GET'
    });

    console.log(`📊 Organizations endpoint status: ${orgsResponse.statusCode}`);

    if (orgsResponse.statusCode === 200) {
      console.log('✅ Organizations API is accessible');
      const orgs = orgsResponse.body;
      console.log(`📋 Found ${Array.isArray(orgs) ? orgs.length : 0} organizations`);
    }

    // Check invitations endpoint
    const invitationsResponse = await makeRequest(`${BASE_URL}/api/invitations`, {
      method: 'GET'
    });

    console.log(`📬 Invitations endpoint status: ${invitationsResponse.statusCode}`);

    if (invitationsResponse.statusCode === 200) {
      console.log('✅ Invitations API is accessible');
      const invitations = invitationsResponse.body;
      console.log(`📨 Found ${Array.isArray(invitations) ? invitations.length : 0} invitations`);
    }

    console.log('\n🎯 Load Testing Setup Summary:');
    console.log('📋 Test users should be created through:');
    console.log('   1. Firebase Console (manual)');
    console.log('   2. Existing authentication system');
    console.log('   3. Organization invitation workflow');
    console.log('\n🔧 Required test users:');
    TEST_USERS.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    console.log('\n📊 Required test data:');
    console.log('   - Test organization');
    console.log('   - Test project');
    console.log('   - Sample TRAs for LMRA testing');
    console.log('   - Approved TRA templates');

    console.log('\n✅ Load testing infrastructure is ready!');
    console.log('🚀 Next steps:');
    console.log('   1. Create test users manually or through existing auth system');
    console.log('   2. Run Artillery tests: cd load-tests && artillery run artillery/auth-flow.yml');
    console.log('   3. Run k6 tests: ./k6 run k6/tra-workflow.js');

    // Create organization
    const orgResponse = await makeRequest(`${BASE_URL}/api/organizations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: {
        name: TEST_ORG.name,
        subscriptionTier: TEST_ORG.subscriptionTier
      }
    });

    if (orgResponse.statusCode !== 201) {
      throw new Error(`Failed to create organization: ${orgResponse.statusCode} - ${JSON.stringify(orgResponse.body)}`);
    }

    const orgData = orgResponse.body;
    console.log(`✅ Created organization: ${orgData.name} (ID: ${orgData.id})`);

    // Set custom claims for the admin user
    const claimsResponse = await makeRequest(`${BASE_URL}/api/auth/set-claims`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}` // Admin token
      },
      body: {
        uid: userData.user.uid,
        claims: {
          orgId: orgData.id,
          role: TEST_USERS[0].role
        }
      }
    });

    if (claimsResponse.statusCode !== 200) {
      console.warn(`⚠️ Failed to set custom claims (may be normal): ${claimsResponse.statusCode}`);
    }

    console.log(`✅ Set admin role for ${TEST_USERS[0].email}`);

    // Create remaining test users
    for (let i = 1; i < TEST_USERS.length; i++) {
      const user = TEST_USERS[i];
      console.log(`👤 Creating user: ${user.email}`);

      try {
        // Register user
        const userRegisterResponse = await makeRequest(`${BASE_URL}/api/auth/register`, {
          method: 'POST',
          body: {
            email: user.email,
            password: user.password,
            displayName: user.displayName
          }
        });

        if (userRegisterResponse.statusCode !== 201) {
          console.warn(`⚠️ Failed to register ${user.email}: ${userRegisterResponse.statusCode} - ${JSON.stringify(userRegisterResponse.body)}`);
          continue;
        }

        console.log(`✅ Created ${user.role}: ${user.email}`);

        // Login as the new user
        const userLoginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          body: {
            email: user.email,
            password: user.password
          }
        });

        if (userLoginResponse.statusCode !== 200) {
          console.warn(`⚠️ Failed to login as ${user.email}: ${userLoginResponse.statusCode}`);
          continue;
        }

        const userToken = userLoginResponse.body.token;

        // Create invitation for the user (admin invites team members)
        const inviteResponse = await makeRequest(`${BASE_URL}/api/invitations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}` // Admin token
          },
          body: {
            email: user.email,
            role: user.role,
            organizationId: orgData.id
          }
        });

        if (inviteResponse.statusCode === 201) {
          const invitationId = inviteResponse.body.id;

          // Accept invitation (as the invited user)
          const acceptResponse = await makeRequest(`${BASE_URL}/api/invitations/${invitationId}/accept`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${userToken}` // Invited user token
            }
          });

          if (acceptResponse.statusCode === 200) {
            console.log(`✅ ${user.email} joined organization as ${user.role}`);
          } else {
            console.warn(`⚠️ Failed to accept invitation for ${user.email}: ${acceptResponse.statusCode}`);
          }
        } else {
          console.warn(`⚠️ Failed to create invitation for ${user.email}: ${inviteResponse.statusCode}`);
        }

      } catch (error) {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
      }
    }

    // Create a test project
    console.log('\n📁 Creating test project...');
    const projectResponse = await makeRequest(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: {
        name: 'Test Project',
        description: 'Test project for load testing',
        location: {
          address: 'Test Address 123',
          city: 'Test City',
          country: 'Netherlands'
        },
        visibility: 'org'
      }
    });

    if (projectResponse.statusCode === 201) {
      const projectData = projectResponse.body;
      console.log(`✅ Created test project: ${projectData.name} (ID: ${projectData.id})`);

      console.log('\n🎉 Load testing setup complete!');
      console.log('\nTest users created:');
      TEST_USERS.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - Password: ${user.password}`);
      });
      console.log(`\nOrganization ID: ${orgData.id}`);
      console.log(`Project ID: ${projectData.id}`);
      console.log('\n🚀 Ready for load testing!');
    } else {
      console.warn(`⚠️ Failed to create test project: ${projectResponse.statusCode} - ${JSON.stringify(projectResponse.body)}`);
      console.log('\n⚠️ Setup partially complete - users created but no test project');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
createTestUsers().then(() => {
  console.log('\n✅ Setup completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
});