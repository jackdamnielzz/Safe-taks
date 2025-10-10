import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const traCreationRate = new Rate('tra_creation_success');
const traCreationDuration = new Trend('tra_creation_duration');
const traApprovalRate = new Rate('tra_approval_success');
const errorCount = new Counter('errors');

// Load test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 20 },   // Stay at 20 users
    { duration: '2m', target: 30 },   // Peak at 30 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // 95% < 1s, 99% < 2s
    http_req_failed: ['rate<0.02'],                   // Error rate < 2%
    tra_creation_success: ['rate>0.95'],              // 95% success rate
    tra_approval_success: ['rate>0.98'],              // 98% success rate
  },
  ext: {
    loadimpact: {
      projectID: 3000000,
      name: 'TRA Workflow Load Test'
    }
  }
};

// Environment configuration
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000/api';
const ORG_ID = __ENV.TEST_ORG_ID || 'test-org-id';

// Test data generators
function generateTRAData(templateId = null) {
  const traId = `tra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    title: `Load Test TRA ${traId}`,
    description: 'Automated load testing TRA for performance validation',
    projectId: `project-${Math.floor(Math.random() * 100)}`,
    organizationId: ORG_ID,
    status: 'draft',
    ...(templateId && { templateId }),
    taskSteps: [
      {
        stepNumber: 1,
        description: 'Prepare work area',
        hazards: [
          {
            hazardId: 'falling_objects',
            description: 'Risk of falling objects',
            probability: 3,
            exposure: 6,
            consequence: 7,
            riskScore: 126,
            riskLevel: 'high',
            controlMeasures: [
              {
                description: 'Use hard hat',
                type: 'ppe',
                effectiveness: 'high',
                responsible: 'field_worker'
              }
            ]
          }
        ]
      },
      {
        stepNumber: 2,
        description: 'Execute work',
        hazards: [
          {
            hazardId: 'manual_handling',
            description: 'Heavy lifting required',
            probability: 6,
            exposure: 6,
            consequence: 3,
            riskScore: 108,
            riskLevel: 'medium',
            controlMeasures: [
              {
                description: 'Use lifting equipment',
                type: 'engineering',
                effectiveness: 'high',
                responsible: 'supervisor'
              }
            ]
          }
        ]
      }
    ]
  };
}

// Authentication helper
function authenticate(email, password) {
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: email,
    password: password
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('token') !== undefined
  });

  return loginRes.json('token');
}

// Main test scenario
export default function () {
  const authToken = authenticate(
    __ENV.TEST_ADMIN_EMAIL || 'admin@test.com',
    __ENV.TEST_ADMIN_PASSWORD || 'TestPassword123!'
  );

  if (!authToken) {
    errorCount.add(1);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };

  // Scenario 1: Create TRA from scratch
  group('Create TRA from Scratch', function () {
    const traData = generateTRAData();
    const startTime = Date.now();

    const createRes = http.post(
      `${BASE_URL}/tras`,
      JSON.stringify(traData),
      { headers }
    );

    const duration = Date.now() - startTime;
    traCreationDuration.add(duration);

    const success = check(createRes, {
      'TRA created': (r) => r.status === 201,
      'TRA has ID': (r) => r.json('id') !== undefined,
      'TRA status is draft': (r) => r.json('status') === 'draft'
    });

    traCreationRate.add(success);

    if (success) {
      const traId = createRes.json('id');
      sleep(1);

      // Retrieve created TRA
      const getRes = http.get(`${BASE_URL}/tras/${traId}`, { headers });
      check(getRes, {
        'TRA retrieved': (r) => r.status === 200,
        'TRA data matches': (r) => r.json('title') === traData.title
      });
    } else {
      errorCount.add(1);
    }

    sleep(2);
  });

  // Scenario 2: Create TRA from template
  group('Create TRA from Template', function () {
    // Get available templates
    const templatesRes = http.get(
      `${BASE_URL}/templates?limit=10&isActive=true`,
      { headers }
    );

    if (check(templatesRes, { 'templates loaded': (r) => r.status === 200 })) {
      const templates = templatesRes.json();
      
      if (templates && templates.length > 0) {
        const templateId = templates[0].id;
        const traData = generateTRAData(templateId);

        const createRes = http.post(
          `${BASE_URL}/tras`,
          JSON.stringify(traData),
          { headers }
        );

        const success = check(createRes, {
          'TRA from template created': (r) => r.status === 201,
          'TRA has template ID': (r) => r.json('templateId') === templateId
        });

        traCreationRate.add(success);

        if (success) {
          const traId = createRes.json('id');
          sleep(1);

          // Update TRA
          const updateRes = http.patch(
            `${BASE_URL}/tras/${traId}`,
            JSON.stringify({ description: 'Updated from template' }),
            { headers }
          );

          check(updateRes, {
            'TRA updated': (r) => r.status === 200
          });
        }
      }
    }

    sleep(2);
  });

  // Scenario 3: TRA List and Search
  group('TRA List and Search', function () {
    // List TRAs
    const listRes = http.get(
      `${BASE_URL}/tras?limit=20&sortBy=createdAt&sortOrder=desc`,
      { headers }
    );

    check(listRes, {
      'TRA list loaded': (r) => r.status === 200,
      'TRA list has items': (r) => Array.isArray(r.json())
    });

    sleep(1);

    // Filter TRAs
    const filterRes = http.get(
      `${BASE_URL}/tras?status=draft,pending_approval&overallRiskLevel=high,very_high&limit=10`,
      { headers }
    );

    check(filterRes, {
      'Filtered TRAs loaded': (r) => r.status === 200
    });

    sleep(1);

    // Search TRAs
    const searchRes = http.get(
      `${BASE_URL}/tras?search=electrical&limit=15`,
      { headers }
    );

    check(searchRes, {
      'Search results loaded': (r) => r.status === 200
    });

    sleep(2);
  });

  // Scenario 4: TRA Approval Workflow
  group('TRA Approval Workflow', function () {
    // Create a TRA for approval
    const traData = generateTRAData();
    const createRes = http.post(
      `${BASE_URL}/tras`,
      JSON.stringify(traData),
      { headers }
    );

    if (check(createRes, { 'TRA created for approval': (r) => r.status === 201 })) {
      const traId = createRes.json('id');
      sleep(1);

      // Submit for approval
      const submitRes = http.post(
        `${BASE_URL}/tras/${traId}/submit`,
        null,
        { headers }
      );

      check(submitRes, {
        'TRA submitted': (r) => r.status === 200
      });

      sleep(2);

      // Approve TRA
      const approveRes = http.post(
        `${BASE_URL}/tras/${traId}/approve`,
        JSON.stringify({
          comments: 'Approved via load test',
          signature: 'LoadTestApprover'
        }),
        { headers }
      );

      const approved = check(approveRes, {
        'TRA approved': (r) => r.status === 200
      });

      traApprovalRate.add(approved);

      if (approved) {
        sleep(1);

        // Verify approval
        const verifyRes = http.get(`${BASE_URL}/tras/${traId}`, { headers });
        check(verifyRes, {
          'TRA status is approved': (r) => r.json('status') === 'approved'
        });
      }
    }

    sleep(2);
  });

  // Scenario 5: TRA Comments
  group('TRA Comments and Collaboration', function () {
    // Create a TRA
    const traData = generateTRAData();
    const createRes = http.post(
      `${BASE_URL}/tras`,
      JSON.stringify(traData),
      { headers }
    );

    if (check(createRes, { 'TRA created for comments': (r) => r.status === 201 })) {
      const traId = createRes.json('id');
      sleep(1);

      // Add comment
      const commentRes = http.post(
        `${BASE_URL}/tras/${traId}/comments`,
        JSON.stringify({
          content: `Load test comment ${Date.now()}`,
          section: 'taskSteps'
        }),
        { headers }
      );

      if (check(commentRes, { 'Comment added': (r) => r.status === 201 })) {
        const commentId = commentRes.json('id');
        sleep(1);

        // Get comments
        const getCommentsRes = http.get(
          `${BASE_URL}/tras/${traId}/comments`,
          { headers }
        );

        check(getCommentsRes, {
          'Comments retrieved': (r) => r.status === 200
        });

        sleep(1);

        // Resolve comment
        const resolveRes = http.patch(
          `${BASE_URL}/tras/${traId}/comments/${commentId}`,
          JSON.stringify({ resolved: true }),
          { headers }
        );

        check(resolveRes, {
          'Comment resolved': (r) => r.status === 200
        });
      }
    }

    sleep(2);
  });

  sleep(Math.random() * 3 + 2); // Random think time between 2-5 seconds
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total errors: ${errorCount.value}`);
}