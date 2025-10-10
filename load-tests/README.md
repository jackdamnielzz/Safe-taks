# Load Testing Infrastructure for TRA/LMRA Application

## Overview

This directory contains comprehensive load testing infrastructure for the SafeWork Pro TRA/LMRA application. The tests are designed to validate performance, scalability, and reliability of the Next.js + Firebase architecture under various load conditions.

## Tools

### Artillery (Installed ✅)
- **Purpose**: API load testing with YAML-based configuration
- **Version**: 2.0.26
- **Use Cases**: Quick API endpoint testing, scenario-based load tests
- **Documentation**: https://www.artillery.io/docs

### k6 (Installation Required)
- **Purpose**: Scriptable load testing with JavaScript
- **Use Cases**: Complex workflows, custom metrics, advanced scenarios
- **Installation**: 
  ```bash
  # Windows (using Chocolatey)
  choco install k6
  
  # Or download from: https://k6.io/docs/getting-started/installation/
  ```
- **Documentation**: https://k6.io/docs/

## Directory Structure

```
load-tests/
├── artillery/              # Artillery test configurations
│   ├── auth-flow.yml      # Authentication and session management
│   ├── tra-creation.yml   # TRA creation workflows
│   ├── lmra-execution.yml # LMRA execution patterns
│   └── dashboard-reports.yml # Dashboard and report generation
├── k6/                    # k6 test scripts
│   ├── tra-workflow.js    # TRA workflow scenarios
│   └── lmra-execution.js  # LMRA execution scenarios
├── scripts/               # Helper scripts and processors
│   ├── auth-processor.js  # Authentication helpers
│   ├── tra-processor.js   # TRA data generators
│   ├── lmra-processor.js  # LMRA data generators
│   └── dashboard-processor.js # Dashboard helpers
├── config/                # Configuration files
│   └── .env.example       # Environment variables template
└── results/               # Test results and reports

```

## Setup

### 1. Environment Configuration

Copy the example environment file and configure your test environment:

```bash
cp config/.env.example config/.env
```

Edit `config/.env` with your test environment details:

```env
# Target Environment
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api

# Test User Credentials
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=TestPassword123!
TEST_SAFETY_MANAGER_EMAIL=safety@test.com
TEST_SAFETY_MANAGER_PASSWORD=TestPassword123!
TEST_FIELD_WORKER_EMAIL=worker@test.com
TEST_FIELD_WORKER_PASSWORD=TestPassword123!

# Test Organization
TEST_ORG_ID=test-org-id

# Load Testing Parameters
VIRTUAL_USERS=10
DURATION=60s
```

### 2. Create Test Users

Before running load tests, ensure test users exist in your Firebase project:

```bash
# Use Firebase Console or run a setup script
# Users should have appropriate roles: admin, safety_manager, field_worker
```

### 3. Prepare Test Data

Ensure your test environment has:
- At least 5-10 approved TRAs for LMRA execution tests
- Active projects for TRA creation
- Templates for template-based TRA creation

## Running Tests

### Artillery Tests

#### Authentication Flow
```bash
cd load-tests
artillery run artillery/auth-flow.yml --output results/auth-flow-$(date +%Y%m%d-%H%M%S).json
```

#### TRA Creation Workflow
```bash
artillery run artillery/tra-creation.yml --output results/tra-creation-$(date +%Y%m%d-%H%M%S).json
```

#### LMRA Execution
```bash
artillery run artillery/lmra-execution.yml --output results/lmra-execution-$(date +%Y%m%d-%H%M%S).json
```

#### Dashboard and Reports
```bash
artillery run artillery/dashboard-reports.yml --output results/dashboard-$(date +%Y%m%d-%H%M%S).json
```

#### Generate HTML Report
```bash
artillery report results/your-test-result.json --output results/report.html
```

### k6 Tests

#### TRA Workflow
```bash
cd load-tests
k6 run k6/tra-workflow.js
```

#### LMRA Execution
```bash
k6 run k6/lmra-execution.js
```

#### With Custom Configuration
```bash
k6 run --vus 20 --duration 5m k6/tra-workflow.js
```

#### Output to InfluxDB (Optional)
```bash
k6 run --out influxdb=http://localhost:8086/k6 k6/tra-workflow.js
```

## Test Scenarios

### 1. Authentication and Session Management

**File**: `artillery/auth-flow.yml`

**Scenarios**:
- User registration flow
- User login flow
- Session management
- Password reset flow
- Concurrent session test

**Performance Targets**:
- Max error rate: 1%
- P95 response time: <500ms
- P99 response time: <1000ms

### 2. TRA Creation Workflows

**Files**: `artillery/tra-creation.yml`, `k6/tra-workflow.js`

**Scenarios**:
- Create TRA from scratch
- Create TRA from template
- TRA list and filter
- TRA search
- TRA approval workflow
- TRA comments and collaboration
- Bulk TRA operations

**Performance Targets**:
- Max error rate: 2%
- P95 response time: <1000ms
- P99 response time: <2000ms
- TRA creation success rate: >95%

### 3. LMRA Execution Patterns

**Files**: `artillery/lmra-execution.yml`, `k6/lmra-execution.js`

**Scenarios**:
- Complete 8-step LMRA execution
- LMRA stop work decision
- LMRA with photo documentation
- LMRA list and filter
- Real-time LMRA dashboard
- Offline LMRA sync simulation

**Performance Targets**:
- Max error rate: 1% (safety-critical)
- P95 response time: <800ms
- P99 response time: <1500ms
- LMRA creation success rate: >98%
- LMRA completion success rate: >95%

### 4. Dashboard and Report Generation

**File**: `artillery/dashboard-reports.yml`

**Scenarios**:
- Executive dashboard load
- LMRA analytics dashboard
- Cohort analysis dashboard
- Real-time dashboard updates
- PDF report generation
- Excel report generation
- Custom report builder
- Concurrent dashboard access

**Performance Targets**:
- Max error rate: 2%
- P95 response time: <2000ms
- P99 response time: <3000ms

## Performance Thresholds

### API Response Times
- **Authentication**: <500ms (P95)
- **TRA CRUD**: <1000ms (P95)
- **LMRA Operations**: <800ms (P95)
- **Dashboard Load**: <2000ms (P95)
- **Report Generation**: <3000ms (P95)

### Error Rates
- **Safety-Critical Operations** (LMRA): <1%
- **Standard Operations**: <2%
- **Complex Operations** (Reports): <3%

### Throughput
- **Concurrent Users**: 30+ simultaneous users
- **Requests per Second**: 50+ RPS sustained
- **TRA Creation**: 10+ per minute
- **LMRA Execution**: 5+ per minute

## Monitoring and Analysis

### Real-time Monitoring

During load tests, monitor:
1. **Firebase Console**: Firestore operations, Auth activity
2. **Vercel Dashboard**: Function invocations, bandwidth
3. **Application Logs**: Error rates, slow queries
4. **Browser DevTools**: Network tab for frontend performance

### Post-Test Analysis

1. **Artillery Reports**:
   ```bash
   artillery report results/test-result.json
   ```

2. **k6 Metrics**:
   - Check console output for custom metrics
   - Review http_req_duration trends
   - Analyze error counts and rates

3. **Firebase Performance**:
   - Review Firestore query performance
   - Check for index warnings
   - Analyze function execution times

### Key Metrics to Track

- **Response Time Percentiles**: P50, P95, P99
- **Error Rates**: By endpoint and scenario
- **Throughput**: Requests per second
- **Concurrent Users**: Active sessions
- **Resource Utilization**: Firebase quotas, Vercel bandwidth

## Troubleshooting

### Common Issues

#### 1. Authentication Failures
```
Error: 401 Unauthorized
```
**Solution**: Verify test user credentials in `.env` file

#### 2. Rate Limiting
```
Error: 429 Too Many Requests
```
**Solution**: Reduce virtual users or increase ramp-up time

#### 3. Firebase Quota Exceeded
```
Error: Quota exceeded
```
**Solution**: Use Firebase emulator for local testing or upgrade Firebase plan

#### 4. Timeout Errors
```
Error: Request timeout
```
**Solution**: Increase timeout in test configuration or optimize API endpoints

### Debug Mode

Run tests with verbose output:

```bash
# Artillery
artillery run --debug artillery/auth-flow.yml

# k6
k6 run --http-debug k6/tra-workflow.js
```

## Best Practices

### 1. Test Environment Isolation
- Use dedicated test Firebase project
- Separate test data from production
- Clean up test data after runs

### 2. Gradual Load Increase
- Start with low virtual users
- Gradually increase load
- Monitor for breaking points

### 3. Realistic Scenarios
- Use production-like data
- Simulate actual user behavior
- Include think time between requests

### 4. Regular Testing
- Run load tests before major releases
- Test after infrastructure changes
- Establish performance baselines

### 5. Data Cleanup
- Archive old test results
- Clean up test data regularly
- Monitor storage usage

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Artillery
        run: npm install -g artillery@latest
      
      - name: Run Load Tests
        run: |
          cd load-tests
          artillery run artillery/auth-flow.yml --output results/auth-flow.json
          artillery run artillery/tra-creation.yml --output results/tra-creation.json
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: load-tests/results/
```

## Next Steps

1. **Install k6**: Follow installation instructions above
2. **Configure Environment**: Set up `.env` file with test credentials
3. **Create Test Users**: Set up test users in Firebase
4. **Run Initial Tests**: Start with authentication flow
5. **Analyze Results**: Review performance metrics
6. **Optimize**: Address any performance bottlenecks
7. **Automate**: Integrate with CI/CD pipeline

## Support and Resources

- **Artillery Documentation**: https://www.artillery.io/docs
- **k6 Documentation**: https://k6.io/docs/
- **Firebase Performance**: https://firebase.google.com/docs/perf-mon
- **Next.js Performance**: https://nextjs.org/docs/advanced-features/measuring-performance

## Contributing

When adding new load tests:
1. Follow existing naming conventions
2. Document test scenarios and targets
3. Include performance thresholds
4. Update this README with new tests
5. Test locally before committing

## License

Internal use only - SafeWork Pro TRA/LMRA Application