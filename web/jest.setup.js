/**
 * Jest setup for project tests.
 * Provides compatibility shims so tests can import server helpers via both alias imports
 * ('lib/server-helpers') and relative paths used in some tests.
 *
 * Also exposes a minimal in-memory Firestore shim with Timestamp, writeBatch, runTransaction,
 * and basic batch API used by server-side integration tests.
 *
 * Added: lightweight polyfills for Request/Response/Headers and a minimal fetch stub,
 * and an analytics mock to ensure modules importing analytics see a jest.fn().
 */

require('@testing-library/jest-dom');

// Ensure firebase/app and firebase/analytics are mocked to prevent module-eval initialization errors in tests.
// Some modules call getApp() / getAnalytics() at import time; provide lightweight mocks here.
jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn(() => ({})),
    getApp: jest.fn(() => ({})),
    getApps: jest.fn(() => []),
    deleteApp: jest.fn(() => Promise.resolve()),
  };
});

// Mock firebase/analytics to provide getAnalytics and isSupported
jest.mock('firebase/analytics', () => {
  return {
    getAnalytics: jest.fn(() => null),
    isSupported: jest.fn(async () => false),
  };
});

// Mock firebase-admin globally to prevent ESM module loading issues
// Note: This mock is defined before mockFirestore is created, so we use a getter function
jest.mock('@/lib/firebase-admin', () => {
  // Access global.mockFirestore via getter to ensure it's available when accessed
  return {
    get db() {
      return global.mockFirestore;
    },
    auth: {
      verifyIdToken: jest.fn(),
      setCustomUserClaims: jest.fn(),
    },
    storage: {
      bucket: jest.fn(() => ({
        file: jest.fn(),
        upload: jest.fn(),
      })),
    },
    setCustomClaims: jest.fn(),
    verifyIdToken: jest.fn(),
  };
});

// Mock audit module globally
jest.mock('@/lib/audit', () => ({
  writeAuditLog: jest.fn(async () => Promise.resolve()),
}));

// Mock NextResponse for API route testing
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => {
      const response = new global.Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
      });
      return response;
    },
  },
}));

// Lightweight Request/Response/Headers polyfills (minimal surface area)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input?.url;
      this.method = init.method || (input && input.method) || 'GET';
      this.headers = init.headers || (input && input.headers) || {};
      this.body = init.body || (input && input.body) || null;
    }
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
  };
}
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body = null, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.headers = init.headers || {};
    }
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
    text() {
      return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
    }
  };
}
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._map = { ...(init || {}) };
    }
    get(name) {
      return this._map[name];
    }
    set(name, value) {
      this._map[name] = value;
    }
  };
}

// Minimal fetch stub to satisfy modules during tests.
// If tests need real network, replace with undici/node-fetch and install as dev dependency.
if (typeof global.fetch === 'undefined') {
  global.fetch = async function () {
    // Default stub: return a 200 OK empty JSON response.
    return new global.Response(JSON.stringify({}), { status: 200, headers: { 'content-type': 'application/json' } });
  };
}

// Provide compatibility for imports that reference 'lib/server-helpers' or relative paths.
// Create a lightweight server-helpers mock that matches the minimal API used in tests.
// Use a configurable mock that tests can override
const serverHelpers = {
  requireOrgAuth: jest.fn(async () => {
    // Default: return test auth object
    return { orgId: 'test-org', uid: 'test-user', displayName: 'Test User', email: 'test@example.com' };
  }),
  getOrgIdFromRequest: jest.fn(() => 'test-org'),
  initializeAdmin: jest.fn(() => {
    // Return firestore instance for tests
    return { firestore: global.mockFirestore };
  }),
  // add other helpers as needed by tests
};

// Mock @/lib/server-helpers globally
jest.mock('@/lib/server-helpers', () => serverHelpers);

// Safer mocking: only call jest.mock if the module can be resolved to avoid resolver errors
try {
  require.resolve('lib/server-helpers');
  // If resolved, instruct jest to use our stub for that module
  jest.mock('lib/server-helpers', () => serverHelpers);
} catch (err) {
  // Module couldn't be resolved at this time; rely on runtime require override below
  // to provide the same stub for relative imports.
}

// Also make it available for relative imports that may use different path depths.
// Tests often import '../../src/lib/server-helpers' or '../lib/server-helpers' — provide fallbacks.
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (request) {
  // If request ends with 'server-helpers' or 'analytics' and wasn't already resolved, return our stubs.
  if (request && request.endsWith('server-helpers')) {
    return serverHelpers;
  }
  if (request && request.endsWith('analytics')) {
    // Prefer to resolve the real module if available; otherwise return our analytics fallback.
    try {
      return originalRequire.apply(this, [request]);
    } catch (e) {
      return global.__analyticsFallback || {
        logEvent: (...args) => (global.mockLogEvent ? global.mockLogEvent(...args) : undefined),
        trackUserLogin: jest.fn(),
        trackUserRegistration: jest.fn(),
      };
    }
  }
  return originalRequire.apply(this, arguments);
};

 // Provide a simple analytics mock so modules that call logEvent etc. will hit jest.fn()
global.mockLogEvent = jest.fn();
try {
  require.resolve('src/lib/analytics');
  jest.mock('src/lib/analytics', () => ({
    logEvent: (...args) => global.mockLogEvent(...args),
    trackUserLogin: jest.fn(),
    trackUserRegistration: jest.fn(),
  }));
} catch (err) {
  // Module not resolvable at setup time; provide a fallback stub that Module.prototype.require can use.
  const analyticsStub = {
    logEvent: (...args) => (global.mockLogEvent ? global.mockLogEvent(...args) : undefined),
    trackUserLogin: jest.fn(),
    trackUserRegistration: jest.fn(),
  };
  global.__analyticsFallback = analyticsStub;
}

// Minimal in-memory Firestore shim used by tests that expect Timestamp, writeBatch, runTransaction, etc.
class InMemoryTimestamp {
  constructor(seconds = Math.floor(Date.now() / 1000), nanoseconds = 0) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }
  toDate() {
    return new Date(this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6));
  }
  static now() {
    return new InMemoryTimestamp();
  }
  static fromDate(d) {
    return new InMemoryTimestamp(Math.floor(d.getTime() / 1000), 0);
  }
}

// Helper to expand FieldValue sentinels in data
function expandFieldValues(data) {
  if (!data || typeof data !== 'object') return data;
  const result = Array.isArray(data) ? [...data] : { ...data };
  for (const key in result) {
    const val = result[key];
    if (val && typeof val === 'object') {
      if (val._type === 'serverTimestamp') {
        result[key] = new Date();
      } else if (val._type === 'arrayUnion') {
        // For simplicity, just store the values - real implementation would merge with existing array
        result[key] = val.vals || [];
      } else if (val._type === 'arrayRemove') {
        // For simplicity, just store empty array - real implementation would remove from existing array
        result[key] = [];
      } else {
        result[key] = expandFieldValues(val);
      }
    }
  }
  return result;
}

function createInMemoryFirestore() {
  const db = {
    _data: {},
    __reset() {
      this._data = {};
    },
    collection(path) {
      const self = this;
      return {
        doc(docId) {
          // If no docId provided, generate one (for .doc() without args)
          if (!docId) {
            docId = `doc_${Math.random().toString(36).slice(2, 10)}`;
          }
          return {
            async get() {
              const key = path + '/' + docId;
              const exists = Object.prototype.hasOwnProperty.call(self._data, key);
              return {
                exists, // property
                id: docId,
                data: () => (exists ? self._data[key] : undefined),
                ref: { id: docId, path: `${path}/${docId}` },
              };
            },
            async set(data, opts) {
              const key = path + '/' + docId;
              const expanded = expandFieldValues(data);
              if (opts && opts.merge) {
                self._data[key] = { ...(self._data[key] || {}), ...expanded };
              } else {
                self._data[key] = expanded;
              }
              return;
            },
            async update(data) {
              const key = path + '/' + docId;
              if (!Object.prototype.hasOwnProperty.call(self._data, key)) {
                throw new Error('Document does not exist');
              }
              const expanded = expandFieldValues(data);
              self._data[key] = { ...self._data[key], ...expanded };
              return;
            },
            async delete() {
              const key = path + '/' + docId;
              delete self._data[key];
              return;
            },
            collection(subPath) {
              const newPath = `${path}/${docId}/${subPath}`;
              if (global.__DEBUG__) {
                console.log(`[Doc.collection Debug] Creating subcollection: ${newPath}`);
              }
              return self.collection(newPath);
            },
            get id() {
              return docId;
            },
            get path() {
              return `${path}/${docId}`;
            },
          };
        },
        async add(data) {
          const id = `doc_${Math.random().toString(36).slice(2, 10)}`;
          const key = path + '/' + id;
          const expanded = expandFieldValues(data);
          db._data[key] = expanded;
          return { id, path: `${path}/${id}`, get: async () => ({ exists: true, data: () => db._data[key] }) };
        },
        where(field, op, value) {
          // Return a query object that supports chaining and .get()
          const query = {
            _filters: [{ field, op, value }],
            where(field, op, value) {
              query._filters.push({ field, op, value });
              return query;
            },
            orderBy(field, direction = 'asc') {
              query._orderBy = { field, direction };
              return query;
            },
            limit(count) {
              query._limit = count;
              return query;
            },
            async get() {
              // Get all docs in this collection
              const allKeys = Object.keys(self._data || {});
              const pathPrefix = path + '/';
              const expectedDepth = path.split('/').length + 1;
              
              // Debug logging
              if (global.__DEBUG__) {
                console.log('[Query Debug] path:', path);
                console.log('[Query Debug] allKeys:', allKeys);
                console.log('[Query Debug] pathPrefix:', pathPrefix);
                console.log('[Query Debug] expectedDepth:', expectedDepth);
              }
              
              let docs = allKeys
                .filter(k => {
                  const startsWithPath = k.startsWith(pathPrefix);
                  const depth = k.split('/').length;
                  const matchesDepth = depth === expectedDepth;
                  
                  if (global.__DEBUG__) {
                    console.log(`[Query Debug] key: ${k}, startsWithPath: ${startsWithPath}, depth: ${depth}, matchesDepth: ${matchesDepth}`);
                  }
                  
                  return startsWithPath && matchesDepth;
                })
                .map(k => {
                  const docId = k.split('/').slice(-1)[0];
                  const docData = self._data[k];
                  return {
                    id: docId,
                    data: () => docData,
                    exists: true,
                    ref: { id: docId, path: k },
                  };
                });

              // Apply filters
              for (const filter of query._filters || []) {
                docs = docs.filter(doc => {
                  const docData = doc.data();
                  const fieldValue = docData[filter.field];
                  switch (filter.op) {
                    case '==':
                      return fieldValue === filter.value;
                    case '!=':
                      return fieldValue !== filter.value;
                    case '<':
                      return fieldValue < filter.value;
                    case '<=':
                      return fieldValue <= filter.value;
                    case '>':
                      return fieldValue > filter.value;
                    case '>=':
                      return fieldValue >= filter.value;
                    case 'in':
                      return Array.isArray(filter.value) && filter.value.includes(fieldValue);
                    case 'array-contains':
                      return Array.isArray(fieldValue) && fieldValue.includes(filter.value);
                    default:
                      return true;
                  }
                });
              }

              // Apply orderBy
              if (query._orderBy) {
                const { field, direction } = query._orderBy;
                docs.sort((a, b) => {
                  const aVal = a.data()[field];
                  const bVal = b.data()[field];
                  if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                  if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                  return 0;
                });
              }

              // Apply limit
              if (query._limit) {
                docs = docs.slice(0, query._limit);
              }

              return {
                empty: docs.length === 0,
                docs,
                size: docs.length,
                forEach(callback) {
                  docs.forEach(callback);
                },
              };
            },
          };
          return query;
        },
      };
    },
    // batch API
    batch() {
      const ops = [];
      return {
        set(ref, data) {
          ops.push({ type: 'set', ref, data });
        },
        update(ref, data) {
          ops.push({ type: 'update', ref, data });
        },
        delete(ref) {
          ops.push({ type: 'delete', ref });
        },
        commit: async () => {
          for (const op of ops) {
            const key = op.ref.path;
            if (op.type === 'set') {
              const expanded = expandFieldValues(op.data);
              db._data[key] = expanded;
            }
            if (op.type === 'update') {
              if (!db._data[key]) throw new Error('Document does not exist');
              const expanded = expandFieldValues(op.data);
              db._data[key] = { ...db._data[key], ...expanded };
            }
            if (op.type === 'delete') delete db._data[key];
          }
          return;
        },
      };
    },
    runTransaction: async (updateFunction) => {
      // Very naive transaction that provides get, set, update, delete helpers.
      const transaction = {
        async get(ref) {
          const key = ref.path;
          const exists = Object.prototype.hasOwnProperty.call(db._data, key);
          return { exists, id: ref.id, data: () => (exists ? db._data[key] : undefined) };
        },
        set(ref, data) {
          const key = ref.path;
          const expanded = expandFieldValues(data);
          db._data[key] = expanded;
        },
        update(ref, data) {
          const key = ref.path;
          if (!db._data[key]) throw new Error('Document does not exist');
          const expanded = expandFieldValues(data);
          db._data[key] = { ...db._data[key], ...expanded };
        },
        delete(ref) {
          const key = ref.path;
          delete db._data[key];
        },
      };
      return updateFunction(transaction);
    },
    Timestamp: InMemoryTimestamp,
    FieldValue: {
      serverTimestamp: () => ({ _type: 'serverTimestamp' }),
      arrayUnion: (...vals) => ({ _type: 'arrayUnion', vals }),
      arrayRemove: (...vals) => ({ _type: 'arrayRemove', vals }),
    },
  };
  return db;
}

// Expose a global mockFirestore instance for tests and mocks to use.
global.mockFirestore = createInMemoryFirestore();

// Also expose firebase-admin mock helpers that server code often expects (admin.firestore())
global.mockAdmin = {
  firestore: () => global.mockFirestore,
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
};

// Provide a simple firebase client mock used by frontend code when necessary.
// Keep minimal surface area — tests that need more can further mock.
global.mockFirebaseClient = {
  auth: jest.fn(() => ({
    currentUser: { uid: 'test-user' },
    signInWithEmailAndPassword: jest.fn(),
    onAuthStateChanged: jest.fn(),
  })),
  firestore: jest.fn(() => global.mockFirestore),
};

// Helpful: expose a utility to reset the in-memory DB between tests.
global.resetMockFirestore = () => {
  global.mockFirestore._data = {};
};

// Console debug helper
global.__DEBUG__ = false;
