# Firebase Emulator Suite Guide

**Project**: SafeWork Pro - TRA/LMRA Web Application  
**Created**: September 30, 2025  
**Last Updated**: September 30, 2025  

## Overview

This guide covers the Firebase Emulator Suite integration for local development and testing. The emulators provide a local environment for Firebase services, enabling faster development and reliable testing without affecting production data.

---

## Emulator Configuration

### Services Configured
- **Authentication Emulator**: Port 9099
- **Firestore Emulator**: Port 8080  
- **Storage Emulator**: Port 9199
- **Emulator UI**: Port 4000 (web interface)

### Configuration Files

**[`firebase.json`](firebase.json:1)** - Main emulator configuration:
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4000 },
    "singleProjectMode": true
  }
}
```

**[`.firebaserc`](.firebaserc:1)** - Project configuration:
```json
{
  "projects": {
    "default": "hale-ripsaw-403915"
  }
}
```

---

## NPM Scripts

The following scripts have been added to [`web/package.json`](web/package.json:1):

```bash
# Start all configured emulators
npm run emulators

# Start only core emulators (recommended for development)
npm run emulators:dev

# Run Jest tests with emulators
npm run emulators:test

# Run Cypress E2E tests with emulators
npm run emulators:e2e

# Run tests with emulators (CI-friendly)
npm run test:emulated

# Kill all running emulators
npm run emulators:kill
```

---

## Usage Instructions

### 1. Starting Emulators

**Development Mode** (recommended):
```bash
cd web
npm run emulators:dev
```

**All Emulators**:
```bash
cd web  
npm run emulators
```

**Direct Firebase CLI**:
```bash
firebase emulators:start --only firestore,auth,storage
```

### 2. Accessing Emulator UI

Once emulators are running, access the web interface at:
- **Emulator UI**: http://localhost:4000
- **Individual Services**:
  - Firestore: http://localhost:8080
  - Auth: http://localhost:9099  
  - Storage: http://localhost:9199

### 3. Running Tests with Emulators

**Jest Unit Tests**:
```bash
npm run test:emulated
# or
npm run emulators:test
```

**Cypress E2E Tests**:
```bash  
npm run emulators:e2e
```

### 4. Stopping Emulators

**Graceful shutdown**:
```bash
npm run emulators:kill
```

**Force stop** (if needed):
```bash
# Windows
taskkill /f /im firebase.exe
# macOS/Linux  
pkill -f firebase
```

---

## Development Integration

### Firebase Emulator Helper

**[`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)** provides utilities for:

- Emulator mode detection
- Firebase service initialization for emulators
- Test data management
- Emulator connection handling

**Key Functions**:
```typescript
// Check if running in emulator mode
isEmulatorMode(): boolean

// Initialize Firebase services for emulators
initializeEmulatorApp(): FirebaseApp

// Get emulator-connected services
getEmulatorAuth(): Auth
getEmulatorFirestore(): Firestore  
getEmulatorStorage(): FirebaseStorage

// Test utilities
clearEmulatorData(): Promise<void>
seedEmulatorData(collections: Record<string, any[]>): Promise<void>
```

### Jest Configuration

The Jest setup has been configured to work with Firebase emulators:

**[`web/jest.setup.js`](web/jest.setup.js:1)** includes:
- Firebase service mocks for unit testing
- Environment variable handling for emulator detection
- Test cleanup utilities

**Test Example**:
```typescript
import { initializeEmulatorApp, getEmulatorFirestore } from '../lib/firebase-emulator';

describe('Firebase Emulator Tests', () => {
  beforeAll(() => {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    initializeEmulatorApp();
  });

  it('should connect to Firestore emulator', async () => {
    const db = getEmulatorFirestore();
    // Test Firestore operations
  });
});
```

---

## Environment Variables

For emulator mode detection, set these environment variables:

```bash
# Firestore Emulator
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080

# Auth Emulator  
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099

# Storage Emulator
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
```

**Note**: These are automatically set when using the npm scripts or Firebase CLI.

---

## Testing Strategy

### Unit Tests with Emulators
- Run isolated Firebase service tests
- Test data model operations
- Validate security rules
- Test authentication flows

### Integration Tests
- End-to-end workflows with real Firebase operations
- Multi-service interactions
- Data consistency validation
- Performance testing

### Test Data Management
- Use [`clearEmulatorData()`](web/src/lib/firebase-emulator.ts:91) for clean test setup
- Seed test data with [`seedEmulatorData()`](web/src/lib/firebase-emulator.ts:105)
- Isolated test runs with fresh emulator state

---

## Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
Error: Port 8080 is already in use
```
**Solution**: Kill existing emulators or change ports in [`firebase.json`](firebase.json:1)

**2. Emulators Won't Start**
```bash
Error: No emulators to start
```
**Solution**: Ensure [`firebase.json`](firebase.json:1) is properly configured and run from project root

**3. Connection Refused**
```bash
Error: connect ECONNREFUSED 127.0.0.1:8080
```
**Solution**: Start emulators before running tests, check firewall settings

**4. Jest Tests Failing**
```bash
TypeError: Cannot read properties of undefined
```
**Solution**: Verify Jest mocks are properly configured in [`jest.setup.js`](web/jest.setup.js:1)

### Debug Commands

**Check emulator status**:
```bash
firebase emulators:kill
firebase emulators:start --inspect-functions
```

**View emulator logs**:
```bash
firebase emulators:start --debug
```

**Test connectivity**:
```bash
curl http://localhost:8080
curl http://localhost:9099
```

---

## Dependencies Installed

The following packages have been added to support Firebase emulators:

```json
{
  "devDependencies": {
    "firebase-tools": "^14.17.0",
    "@firebase/rules-unit-testing": "^5.0.0"
  }
}
```

---

## Security Considerations

### Emulator Safety
- Emulators are for **development only** - never use in production
- Local emulators don't enforce authentication by default
- Security rules are tested but may behave differently than production
- Data in emulators is ephemeral and lost on restart

### Production vs. Emulator Differences
- Authentication tokens may have different validation
- Network latency is near-zero in emulators
- Some Firebase features may not be fully emulated
- Production quotas and limits don't apply

---

## Next Steps

### Immediate Actions
1. **Test Emulator Setup**: Run `npm run emulators:dev` to verify configuration
2. **Run Test Suite**: Execute `npm run test:emulated` to validate integration
3. **Explore Emulator UI**: Access http://localhost:4000 when emulators are running

### Future Enhancements
1. **Add Functions Emulator**: When Firebase Functions are needed
2. **Pub/Sub Emulator**: For event-driven architecture
3. **Firebase Extensions**: Local testing of Firebase Extensions
4. **Advanced Testing**: Performance testing, load testing with emulators

---

## Resources

- [Firebase Emulator Suite Documentation](https://firebase.google.com/docs/emulator-suite)
- [Firebase Local Development Guide](https://firebase.google.com/docs/emulator-suite/connect_and_prototype)
- [Testing with Firebase Emulators](https://firebase.google.com/docs/emulator-suite/unit_test_security_rules)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

**Status**: ✅ **Completed**  
**Task 2.6C**: Firebase Emulator Suite Integration - Ready for Development and Testing