import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const lmraCreationRate = new Rate('lmra_creation_success');
const lmraCompletionRate = new Rate('lmra_completion_success');
const lmraExecutionDuration = new Trend('lmra_execution_duration');
const stopWorkDecisions = new Counter('stop_work_decisions');
const safeDecisions = new Counter('safe_decisions');
const activeSessionsGauge = new Gauge('active_lmra_sessions');
const errorCount = new Counter('errors');

// Load test configuration
export const options = {
  stages: [
    { duration: '1m', target: 5 },    // Ramp up to 5 field workers
    { duration: '3m', target: 10 },   // Stay at 10 field workers
    { duration: '2m', target: 15 },   // Peak at 15 field workers
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],  // 95% < 800ms, 99% < 1.5s
    http_req_failed: ['rate<0.01'],                   // Error rate < 1% (safety-critical)
    lmra_creation_success: ['rate>0.98'],             // 98% success rate
    lmra_completion_success: ['rate>0.95'],           // 95% completion rate
  },
  ext: {
    loadimpact: {
      projectID: 3000001,
      name: 'LMRA Execution Load Test'
    }
  }
};

// Environment configuration
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000/api';
const ORG_ID = __ENV.TEST_ORG_ID || 'test-org-id';

// Test data generators
function generateLMRAData(traId, projectId) {
  return {
    traId: traId,
    projectId: projectId,
    organizationId: ORG_ID,
    location: {
      latitude: 52.0907 + (Math.random() - 0.5) * 0.01,
      longitude: 5.1214 + (Math.random() - 0.5) * 0.01,
      accuracy: Math.floor(Math.random() * 15) + 5,
      address: 'Utrecht, Netherlands'
    },
    weather: {
      temperature: Math.floor(Math.random() * 15) + 10,
      condition: ['clear', 'partly_cloudy', 'cloudy'][Math.floor(Math.random() * 3)],
      windSpeed: Math.floor(Math.random() * 20) + 5,
      visibility: 'good'
    },
    personnel: [
      {
        userId: `user-${Math.floor(Math.random() * 100)}`,
        name: `Load Test Worker ${Math.floor(Math.random() * 100)}`,
        role: 'field_worker',
        competent: true
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

// Get active TRA for LMRA
function getActiveTRA(authToken) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };

  const trasRes = http.get(
    `${BASE_URL}/tras?status=approved&limit=10`,
    { headers }
  );

  if (check(trasRes, { 'TRAs loaded': (r) => r.status === 200 })) {
    const tras = trasRes.json();
    if (tras && tras.length > 0) {
      return {
        traId: tras[0].id,
        projectId: tras[0].projectId
      };
    }
  }

  return null;
}

// Main test scenario
export default function () {
  const authToken = authenticate(
    __ENV.TEST_FIELD_WORKER_EMAIL || 'worker@test.com',
    __ENV.TEST_FIELD_WORKER_PASSWORD || 'TestPassword123!'
  );

  if (!authToken) {
    errorCount.add(1);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };

  // Get an active TRA
  const traInfo = getActiveTRA(authToken);
  if (!traInfo) {
    console.log('No active TRAs available');
    return;
  }

  // Scenario 1: Complete LMRA Execution Flow
  group('Complete LMRA Execution', function () {
    const startTime = Date.now();
    
    // Step 1: Create LMRA Session
    const lmraData = generateLMRAData(traInfo.traId, traInfo.projectId);
    const createRes = http.post(
      `${BASE_URL}/lmra-sessions`,
      JSON.stringify(lmraData),
      { headers }
    );

    const created = check(createRes, {
      'LMRA session created': (r) => r.status === 201,
      'Session has ID': (r) => r.json('id') !== undefined
    });

    lmraCreationRate.add(created);

    if (!created) {
      errorCount.add(1);
      return;
    }

    const sessionId = createRes.json('id');
    activeSessionsGauge.add(1);
    sleep(2);

    // Step 2: Environmental checks
    const envCheckRes = http.patch(
      `${BASE_URL}/lmra-sessions/${sessionId}`,
      JSON.stringify({
        environmentalChecks: {
          weatherAcceptable: true,
          lightingAdequate: true,
          groundConditions: 'stable',
          accessRoutes: 'clear'
        }
      }),
      { headers }
    );

    check(envCheckRes, {
      'Environmental checks updated': (r) => r.status === 200
    });
    sleep(2);

    // Step 3: Equipment verification
    const equipmentRes = http.patch(
      `${BASE_URL}/lmra-sessions/${sessionId}`,
      JSON.stringify({
        equipmentChecks: [
          {
            equipmentId: `hardhat-${Math.floor(Math.random() * 100)}`,
            type: 'ppe',
            condition: 'good',
            verified: true
          },
          {
            equipmentId: `harness-${Math.floor(Math.random() * 100)}`,
            type: 'fall_protection',
            condition: 'good',
            verified: true
          }
        ]
      }),
      { headers }
    );

    check(equipmentRes, {
      'Equipment checks updated': (r) => r.status === 200
    });
    sleep(2);

    // Step 4: Hazard assessment
    const hazardRes = http.patch(
      `${BASE_URL}/lmra-sessions/${sessionId}`,
      JSON.stringify({
        hazardAssessment: {
          identifiedHazards: [
            {
              hazardId: 'falling_objects',
              present: true,
              controlsInPlace: true,
              additionalControls: 'Barricade established'
            }
          ],
          additionalHazards: [
            {
              description: 'Wet surface near work area',
              severity: 'medium',
              controlMeasure: 'Warning signs placed'
            }
          ]
        }
      }),
      { headers }
    );

    check(hazardRes, {
      'Hazard assessment updated': (r) => r.status === 200
    });
    sleep(3);

    // Step 5: Risk decision (90% safe, 10% stop work)
    const isSafe = Math.random() > 0.1;
    const riskDecision = isSafe ? 'safe_to_proceed' : 'stop_work';
    
    if (isSafe) {
      safeDecisions.add(1);
    } else {
      stopWorkDecisions.add(1);
    }

    const decisionRes = http.patch(
      `${BASE_URL}/lmra-sessions/${sessionId}`,
      JSON.stringify({
        riskDecision: riskDecision,
        decisionRationale: isSafe 
          ? 'All controls in place, conditions acceptable'
          : 'Unsafe conditions identified',
        ...(! isSafe && { stopWorkReason: 'unsafe_conditions' })
      }),
      { headers }
    );

    check(decisionRes, {
      'Risk decision recorded': (r) => r.status === 200
    });
    sleep(1);

    // Step 6: Complete session
    const completeRes = http.post(
      `${BASE_URL}/lmra-sessions/${sessionId}/complete`,
      JSON.stringify({
        signature: 'LoadTestWorker',
        completionNotes: isSafe ? 'Work completed safely' : 'Work stopped due to safety concerns'
      }),
      { headers }
    );

    const completed = check(completeRes, {
      'LMRA session completed': (r) => r.status === 200
    });

    lmraCompletionRate.add(completed);
    activeSessionsGauge.add(-1);

    const duration = Date.now() - startTime;
    lmraExecutionDuration.add(duration);

    // Verify completion
    if (completed) {
      sleep(1);
      const verifyRes = http.get(
        `${BASE_URL}/lmra-sessions/${sessionId}`,
        { headers }
      );

      check(verifyRes, {
        'Session status is completed': (r) => r.json('status') === 'completed',
        'Risk decision matches': (r) => r.json('riskDecision') === riskDecision
      });
    }

    sleep(2);
  });

  // Scenario 2: LMRA with Photo Documentation
  group('LMRA with Photos', function () {
    const traInfo = getActiveTRA(authToken);
    if (!traInfo) return;

    const lmraData = generateLMRAData(traInfo.traId, traInfo.projectId);
    const createRes = http.post(
      `${BASE_URL}/lmra-sessions`,
      JSON.stringify(lmraData),
      { headers }
    );

    if (check(createRes, { 'LMRA created for photos': (r) => r.status === 201 })) {
      const sessionId = createRes.json('id');
      sleep(2);

      // Simulate photo upload
      const photoRes = http.patch(
        `${BASE_URL}/lmra-sessions/${sessionId}`,
        JSON.stringify({
          photos: [
            {
              url: `https://storage.example.com/photo-${Date.now()}-1.jpg`,
              caption: 'Work area before start',
              timestamp: new Date().toISOString()
            },
            {
              url: `https://storage.example.com/photo-${Date.now()}-2.jpg`,
              caption: 'Safety equipment in place',
              timestamp: new Date().toISOString()
            }
          ]
        }),
        { headers }
      );

      check(photoRes, {
        'Photos added': (r) => r.status === 200
      });

      sleep(3);

      // Complete session
      http.post(
        `${BASE_URL}/lmra-sessions/${sessionId}/complete`,
        JSON.stringify({ signature: 'LoadTestWorker' }),
        { headers }
      );
    }

    sleep(2);
  });

  // Scenario 3: Offline LMRA Sync Simulation
  group('Offline LMRA Sync', function () {
    const traInfo = getActiveTRA(authToken);
    if (!traInfo) return;

    const lmraData = generateLMRAData(traInfo.traId, traInfo.projectId);
    
    // Add offline metadata
    lmraData.offlineCreated = true;
    lmraData.createdAt = new Date(Date.now() - 300000).toISOString(); // 5 minutes ago

    const createRes = http.post(
      `${BASE_URL}/lmra-sessions`,
      JSON.stringify(lmraData),
      { headers }
    );

    if (check(createRes, { 'Offline LMRA synced': (r) => r.status === 201 })) {
      const sessionId = createRes.json('id');
      sleep(1);

      // Complete immediately (was completed offline)
      const completeRes = http.post(
        `${BASE_URL}/lmra-sessions/${sessionId}/complete`,
        JSON.stringify({
          signature: 'LoadTestWorker',
          offlineCreated: true,
          syncedAt: new Date().toISOString()
        }),
        { headers }
      );

      check(completeRes, {
        'Offline LMRA completed': (r) => r.status === 200
      });
    }

    sleep(2);
  });

  sleep(Math.random() * 3 + 2); // Random think time between 2-5 seconds
}

// Setup function
export function setup() {
  console.log('Starting LMRA execution load test');
  return { startTime: Date.now() };
}

// Teardown function
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Load test completed in ${duration} seconds`);
  console.log(`Total errors: ${errorCount.value}`);
  console.log(`Stop work decisions: ${stopWorkDecisions.value}`);
  console.log(`Safe decisions: ${safeDecisions.value}`);
}