/* eslint-disable */
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

// Stabilize timezone for date-sensitive tests
process.env.TZ = process.env.TZ || "UTC";

// Polyfill TextEncoder/TextDecoder for Node/Jest environment (fixes TextEncoder is not defined)
if (typeof global.TextEncoder === "undefined") {
  // util.TextEncoder available in Node.js
  try {
    const { TextEncoder } = require("util");
    global.TextEncoder = TextEncoder;
  } catch (e) {
    // ignore if not available
  }
}
if (typeof global.TextDecoder === "undefined") {
  try {
    const { TextDecoder } = require("util");
    global.TextDecoder = TextDecoder;
  } catch (e) {
    // ignore if not available
  }
}

require("@testing-library/jest-dom");

// Mock next/navigation to provide a safe useRouter() in component tests.
try {
  jest.mock("next/navigation", () => ({
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      pathname: "/",
      query: {},
      back: jest.fn(),
    }),
  }));
} catch (e) {
  // ignore outside jest
}

// next-intl is now mocked via module mapping in jest.config.js
// This prevents conflicts between the module mapping and manual jest.mock() calls
// try {
//   // Defer requiring the mock inside the factory to avoid circular initialization errors.
//   jest.mock("next-intl", () => {
//     try {
//       return require("./__mocks__/next-intl.js");
//     } catch (e) {
//       // Fallback minimal implementation if the mock cannot be loaded.
//       return {
//         useTranslations: (ns) => (key, vars) => {
//           if (vars && typeof vars === "object") {
//             let str = `${key}`;
//             for (const k of Object.keys(vars)) {
//               str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
//             }
//             return str;
//           }
//           return key;
//         },
//         useFormatter: () => ({
//           formatDate: (d) => (d ? new Date(d).toLocaleString("nl-NL") : ""),
//           formatNumber: (n) => (n === null || n === undefined ? "" : new Intl.NumberFormat("nl-NL").format(n)),
//         }),
//         NextIntlClientProvider: ({ children }) => children,
//         default: {},
//       };
//     }
//   });
// } catch (e) {
//   // ignore when not running under jest
// }
// next-intl is now mocked via module mapping in jest.config.js
// This prevents conflicts between the module mapping and manual jest.mock() calls
// The manual jest.mock() call has been removed to allow the module mapping to work properly

// Provide a lightweight mock for the app AuthProvider so component tests that call useAuth()
// can run without mounting the full provider. Tests can override via jest.mock in individual suites.
try {
  jest.mock("@/components/AuthProvider", () => {
    const React = require("react");
    const testCtx = {
      user: { uid: "test-user", email: "test@example.com" },
      userProfile: { organizationId: "test-org", roles: ["admin"] },
    };
    return {
      __esModule: true,
      default: ({ children }) => React.createElement(React.Fragment, null, children),
      useAuth: () => testCtx,
    };
  });
} catch (e) {
  // ignore when not running under jest
}

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
global.InMemoryTimestamp = InMemoryTimestamp;

// Leave NEXT_PUBLIC_OPENWEATHER_API_KEY as-is so tests can assert behavior when it's missing or present.
// Tests can set process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY as needed; do not force a default here.

// Save original fetch (if any)
const __origFetch = global.fetch;

// Provide a default global.fetch that recognizes OpenWeather requests and returns a deterministic mock.
// Other requests fall back to previous fetch or a simple 200 JSON response.
global.fetch = async function (input, init) {
  const url = typeof input === "string" ? input : input?.url;
  if (url && url.includes("api.openweathermap.org")) {
    // If the request does not include an API key query param and the environment key is empty,
    // mirror the library behavior used by WeatherService tests by throwing a clear error so tests remain deterministic.
    const hasKeyInUrl = url.includes("appid=");
    const envKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!hasKeyInUrl && (!envKey || envKey === "")) {
      throw new Error("OpenWeather API key not configured");
    }

    // Minimal mocked OpenWeather response
    const mockResp = {
      main: { temp: 15.5, humidity: 60 },
      visibility: 10000,
      wind: { speed: 3.5 },
      weather: [{ main: "Clear", description: "clear sky", icon: "01d" }],
    };
    return new global.Response(JSON.stringify(mockResp), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  if (typeof __origFetch === "function") {
    return __origFetch(input, init);
  }

  return new global.Response(JSON.stringify({}), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

// Mock navigator.geolocation to simulate user consent and provide spyable functions for tests
if (typeof global.navigator === "undefined") global.navigator = {};
if (!global.navigator.geolocation) {
  const geo = {
    _permissionGranted: true,
    // Next watch id; deterministic so tests can assert on specific ids (e.g. 123).
    _nextWatchId: 123,
    // Setter to toggle permission in tests: global.navigator.geolocation.setPermissionGranted(false)
    setPermissionGranted: function (v) {
      this._permissionGranted = !!v;
      // Backwards compatibility with existing toggle
      global.__GEO_MOCK_PERMISSION_DENIED = !this._permissionGranted;
    },
    getCurrentPosition: jest.fn(function (success, error) {
      if (!this._permissionGranted) {
        error && error(new Error("Location tracking requires user consent"));
        return;
      }
      success &&
        success({
          coords: { latitude: 52.0, longitude: 4.0, accuracy: 10 },
          timestamp: Date.now(),
        });
    }),
    watchPosition: jest.fn(function (success, error) {
      if (!this._permissionGranted) {
        error && error(new Error("Location tracking requires user consent"));
        return -1;
      }
      // Use deterministic id so unit tests can assert exact clearWatch argument.
      const id = this._nextWatchId++;
      // simulate an immediate callback
      success &&
        success({
          coords: { latitude: 52.0, longitude: 4.0, accuracy: 10 },
          timestamp: Date.now(),
        });
      return id;
    }),
    clearWatch: jest.fn(function (id) {
      // noop for tests, spyable
      return;
    }),
  };
  global.navigator.geolocation = geo;
}

// Firebase auth is mocked via moduleNameMapper in jest.config.js
// The mock is located at src/__mocks__/firebase-auth.ts
// No need to manually jest.mock() it here as the module mapper handles it

// Ensure firebase/app and firebase/analytics are mocked to prevent module-eval initialization errors in tests.
// Some modules call getApp() / getAnalytics() at import time; provide lightweight mocks here.
jest.mock("firebase/app", () => {
  // Provide a minimal app object and stub internal registration used by some firebase submodules.
  const app = {
    initializeApp: jest.fn(() => ({})),
    getApp: jest.fn(() => ({})),
    getApps: jest.fn(() => []),
    deleteApp: jest.fn(() => Promise.resolve()),
    // Prevent runtime errors from modules that call internal registration helpers
    _registerComponent: jest.fn(),
    _removeServiceInstance: jest.fn(),
  };
  return app;
});

// Mock installations/performance modules to avoid runtime registration and native calls during tests.
jest.mock("firebase/installations", () => ({
  getInstallations: jest.fn(() => ({})),
  getId: jest.fn(async () => "mock-installation-id"),
  deleteInstallations: jest.fn(async () => undefined),
}));
jest.mock("@firebase/installations", () => ({
  getInstallations: jest.fn(() => ({})),
  getId: jest.fn(async () => "mock-installation-id"),
}));

jest.mock("firebase/performance", () => ({
  // Provide no-op performance API used by the app
  getPerformance: jest.fn(() => null),
  isSupported: jest.fn(async () => false),
}));
jest.mock("@firebase/performance", () => ({
  getPerformance: jest.fn(() => null),
  isSupported: jest.fn(async () => false),
}));

// Provide the same mock for @firebase/app imports
jest.mock("@firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
  getApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  deleteApp: jest.fn(() => Promise.resolve()),
}));

// Mock firebase/analytics to provide a spyable analytics API for tests
jest.mock("firebase/analytics", () => {
  // Create a mock analytics instance and API surface similar to the real SDK
  const mockAnalyticsInstance = { app: {}, name: "mock-analytics" };
  const mockLogEvent = jest.fn();
  const mockSetUserId = jest.fn();
  const mockSetUserProperties = jest.fn();
  const mockIsSupported = jest.fn(async () => true); // default to supported so analytics code runs in tests

  // Expose on global so tests can assert against these spies
  global.mockAnalyticsInstance = global.mockAnalyticsInstance || mockAnalyticsInstance;
  global.mockLogEvent = global.mockLogEvent || mockLogEvent;
  global.mockSetUserId = global.mockSetUserId || mockSetUserId;
  global.mockSetUserProperties = global.mockSetUserProperties || mockSetUserProperties;
  global.setMockAnalyticsSupported = (v) => {
    mockIsSupported.mockImplementation(async () => !!v);
  };

  return {
    getAnalytics: jest.fn(() => global.mockAnalyticsInstance),
    logEvent: mockLogEvent,
    setUserId: mockSetUserId,
    setUserProperties: mockSetUserProperties,
    isSupported: mockIsSupported,
  };
});

// Mock storage and firestore client modules to avoid runtime getApp/getStorage errors in tests
jest.mock("firebase/storage", () => {
  return {
    getStorage: jest.fn(() => ({})),
    ref: jest.fn(() => ({})),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(async () => ""),
  };
});
jest.mock("@firebase/storage", () => {
  return {
    getStorage: jest.fn(() => ({})),
    ref: jest.fn(() => ({})),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(async () => ""),
  };
});
/**
 * Firestore client mocks:
 *
 * All imports from "firebase/firestore" and "@firebase/firestore" are mapped (via moduleNameMapper)
 * to src/__mocks__/firebase-firestore.ts, which provides a deterministic, in-memory implementation.
 *
 * To avoid divergent behavior, we do NOT redefine those modules here. Instead, we:
 * - Ensure a single global mockFirestore instance is created from the shared mock module.
 * - Expose resetMockFirestore/__clearFirestoreMock helpers for suites that need to isolate state.
 * - Keep everything fully in-process with no real Firebase/emulator calls.
 */
try {
  const firestoreMock = require("./src/__mocks__/firebase-firestore.ts");

  // Initialize a shared global store if not yet present
  if (!global.mockFirestore) {
    // The TS mock keeps its own internal Map; we just expose thin helpers for convenience.
    global.mockFirestore = {
      _isMock: true,
    };
  }

  // Expose deterministic reset helper bridging to the module's __clearFirestoreMock
  if (typeof firestoreMock.__clearFirestoreMock === "function") {
    global.resetMockFirestore = () => {
      firestoreMock.__clearFirestoreMock();
    };
  }
} catch (e) {
  // If the mock module cannot be loaded for some reason, keep tests running with a noop reset.
  if (!global.resetMockFirestore) {
    global.resetMockFirestore = () => {};
  }
}

// Mock firebase-admin globally to prevent ESM module loading issues
// Note: This mock is defined before mockFirestore is created, so we use a getter function
jest.mock("@/lib/firebase-admin", () => {
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
jest.mock("@/lib/audit", () => ({
  writeAuditLog: jest.fn(async () => Promise.resolve()),
}));

// Mock NextResponse for API route testing
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data, init) => {
      const response = new global.Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: { "content-type": "application/json", ...(init?.headers || {}) },
      });
      return response;
    },
  },
}));

// Lightweight Request/Response/Headers polyfills (minimal surface area)
if (typeof global.Request === "undefined") {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === "string" ? input : input?.url;
      this.method = init.method || (input && input.method) || "GET";
      this.headers = init.headers || (input && input.headers) || {};
      this.body = init.body || (input && input.body) || null;
    }
    async json() {
      return typeof this.body === "string" ? JSON.parse(this.body) : this.body;
    }
    async text() {
      return typeof this.body === "string" ? this.body : JSON.stringify(this.body);
    }
  };
}
if (typeof global.Response === "undefined") {
  global.Response = class Response {
    constructor(body = null, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.headers = init.headers || {};
    }
    async json() {
      return typeof this.body === "string" ? JSON.parse(this.body) : this.body;
    }
    text() {
      return Promise.resolve(typeof this.body === "string" ? this.body : JSON.stringify(this.body));
    }
  };
}
if (typeof global.Headers === "undefined") {
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
if (typeof global.fetch === "undefined") {
  global.fetch = async function () {
    // Default stub: return a 200 OK empty JSON response.
    return new global.Response(JSON.stringify({}), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
}

// Provide compatibility for imports that reference 'lib/server-helpers' or relative paths.
// Create a lightweight server-helpers mock that matches the minimal API used in tests.
// Use a configurable mock that tests can override
const serverHelpers = {
  requireOrgAuth: jest.fn(async () => {
    // Default: return test auth object
    return {
      orgId: "test-org",
      uid: "test-user",
      displayName: "Test User",
      email: "test@example.com",
    };
  }),
  getOrgIdFromRequest: jest.fn(() => "test-org"),
  initializeAdmin: jest.fn(() => {
    // Return firestore instance for tests
    return { firestore: global.mockFirestore };
  }),
  // add other helpers as needed by tests
};

// Mock @/lib/server-helpers globally
jest.mock("@/lib/server-helpers", () => serverHelpers);

// Safer mocking: only call jest.mock if the module can be resolved to avoid resolver errors
try {
  require.resolve("lib/server-helpers");
  // If resolved, instruct jest to use our stub for that module
  jest.mock("lib/server-helpers", () => serverHelpers);
} catch (err) {
  // Module couldn't be resolved at this time; rely on runtime require override below
  // to provide the same stub for relative imports.
}

// Also make it available for relative imports that may use different path depths.
// Tests often import '../../src/lib/server-helpers' or '../lib/server-helpers' — provide fallbacks.
const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (request) {
  // If request ends with 'server-helpers' or 'analytics' and wasn't already resolved, return our stubs.
  if (request && request.endsWith("server-helpers")) {
    return serverHelpers;
  }

  // Intercept imports that target an AuthProvider module (relative or aliased)
  if (request && request.endsWith("AuthProvider")) {
    // Return a minimal module that provides `useAuth` and a default provider component.
    return {
      __esModule: true,
      default: function MockAuthProvider(props) {
        return props && props.children ? props.children : null;
      },
      useAuth: function () {
        return {
          user: { uid: "test-user", email: "test@example.com" },
          userProfile: { organizationId: "test-org", roles: ["admin"] },
        };
      },
    };
  }

  if (request && request.endsWith("analytics")) {
    // Prefer to resolve the real module if available; otherwise return our analytics fallback or the global mockAnalytics.
    try {
      return originalRequire.apply(this, [request]);
    } catch (e) {
      return (
        global.__analyticsFallback ||
        global.mockAnalytics || {
          logEvent: (...args) => (global.mockAnalytics ? global.mockAnalytics.logEvent(...args) : undefined),
          trackUserLogin: jest.fn(),
          trackUserRegistration: jest.fn(),
          setUserId: jest.fn(),
          setUserProperties: jest.fn(),
        }
      );
    }
  }
  return originalRequire.apply(this, arguments);
};

// Provide a simple analytics mock so modules that call logEvent etc. will hit jest.fn()
global.mockAnalytics = global.mockAnalytics || {
  logEvent: jest.fn(),
  trackUserLogin: jest.fn(),
  trackUserRegistration: jest.fn(),
  setUserId: jest.fn(),
  setUserProperties: jest.fn(),
  // Default to supported in tests unless explicitly toggled
  isSupported: jest.fn(async () => true),
};

// Helper for tests to toggle analytics support reporting
global.setMockAnalyticsSupported = (v) => {
  global.mockAnalytics.isSupported = jest.fn(async () => !!v);
};

try {
  require.resolve("src/lib/analytics");
  jest.mock("src/lib/analytics", () => ({
    logEvent: (...args) => global.mockAnalytics.logEvent(...args),
    trackUserLogin: global.mockAnalytics.trackUserLogin,
    trackUserRegistration: global.mockAnalytics.trackUserRegistration,
    setUserId: global.mockAnalytics.setUserId,
    setUserProperties: global.mockAnalytics.setUserProperties,
    isSupported: global.mockAnalytics.isSupported,
  }));
} catch (err) {
  // Module not resolvable at setup time; provide a fallback stub that Module.prototype.require can use.
  global.__analyticsFallback = {
    logEvent: (...args) => (global.mockAnalytics ? global.mockAnalytics.logEvent(...args) : undefined),
    trackUserLogin: global.mockAnalytics.trackUserLogin,
    trackUserRegistration: global.mockAnalytics.trackUserRegistration,
    setUserId: global.mockAnalytics.setUserId,
    setUserProperties: global.mockAnalytics.setUserProperties,
    isSupported: global.mockAnalytics.isSupported,
  };
}

// Minimal in-memory Firestore shim used by tests that expect Timestamp, writeBatch, runTransaction, etc.
/* InMemoryTimestamp is declared earlier to avoid duplicate declaration when jest.setup is executed multiple times. */

// Helper to expand FieldValue sentinels in data
function expandFieldValues(data) {
  if (!data || typeof data !== "object") return data;
  const result = Array.isArray(data) ? [...data] : { ...data };
  for (const key in result) {
    const val = result[key];
    if (val && typeof val === "object") {
      if (val._type === "serverTimestamp") {
        result[key] = new Date();
      } else if (val._type === "arrayUnion") {
        // For simplicity, just store the values - real implementation would merge with existing array
        result[key] = val.vals || [];
      } else if (val._type === "arrayRemove") {
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
              const key = path + "/" + docId;
              const exists = Object.prototype.hasOwnProperty.call(self._data, key);
              return {
                exists, // property
                id: docId,
                data: () => (exists ? self._data[key] : undefined),
                ref: { id: docId, path: `${path}/${docId}` },
              };
            },
            async set(data, opts) {
              const key = path + "/" + docId;
              const expanded = expandFieldValues(data);
              if (opts && opts.merge) {
                self._data[key] = { ...(self._data[key] || {}), ...expanded };
              } else {
                self._data[key] = expanded;
              }
              return;
            },
            async update(data) {
              const key = path + "/" + docId;
              if (!Object.prototype.hasOwnProperty.call(self._data, key)) {
                throw new Error("Document does not exist");
              }
              const expanded = expandFieldValues(data);
              self._data[key] = { ...self._data[key], ...expanded };
              return;
            },
            async delete() {
              const key = path + "/" + docId;
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
          const key = path + "/" + id;
          const expanded = expandFieldValues(data);
          db._data[key] = expanded;
          return {
            id,
            path: `${path}/${id}`,
            get: async () => ({ exists: true, data: () => db._data[key] }),
          };
        },
        where(field, op, value) {
          // Return a query object that supports chaining and .get()
          const query = {
            _filters: [{ field, op, value }],
            where(field, op, value) {
              query._filters.push({ field, op, value });
              return query;
            },
            orderBy(field, direction = "asc") {
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
              const pathPrefix = path + "/";
              const expectedDepth = path.split("/").length + 1;

              // Debug logging
              if (global.__DEBUG__) {
                console.log("[Query Debug] path:", path);
                console.log("[Query Debug] allKeys:", allKeys);
                console.log("[Query Debug] pathPrefix:", pathPrefix);
                console.log("[Query Debug] expectedDepth:", expectedDepth);
              }

              let docs = allKeys
                .filter((k) => {
                  const startsWithPath = k.startsWith(pathPrefix);
                  const depth = k.split("/").length;
                  const matchesDepth = depth === expectedDepth;

                  if (global.__DEBUG__) {
                    console.log(
                      `[Query Debug] key: ${k}, startsWithPath: ${startsWithPath}, depth: ${depth}, matchesDepth: ${matchesDepth}`
                    );
                  }

                  return startsWithPath && matchesDepth;
                })
                .map((k) => {
                  const docId = k.split("/").slice(-1)[0];
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
                docs = docs.filter((doc) => {
                  const docData = doc.data();
                  const fieldValue = docData[filter.field];
                  switch (filter.op) {
                    case "==":
                      return fieldValue === filter.value;
                    case "!=":
                      return fieldValue !== filter.value;
                    case "<":
                      return fieldValue < filter.value;
                    case "<=":
                      return fieldValue <= filter.value;
                    case ">":
                      return fieldValue > filter.value;
                    case ">=":
                      return fieldValue >= filter.value;
                    case "in":
                      return Array.isArray(filter.value) && filter.value.includes(fieldValue);
                    case "array-contains":
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
                  if (aVal < bVal) return direction === "asc" ? -1 : 1;
                  if (aVal > bVal) return direction === "asc" ? 1 : -1;
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
          ops.push({ type: "set", ref, data });
        },
        update(ref, data) {
          ops.push({ type: "update", ref, data });
        },
        delete(ref) {
          ops.push({ type: "delete", ref });
        },
        commit: async () => {
          for (const op of ops) {
            const key = op.ref.path;
            if (op.type === "set") {
              const expanded = expandFieldValues(op.data);
              db._data[key] = expanded;
            }
            if (op.type === "update") {
              if (!db._data[key]) throw new Error("Document does not exist");
              const expanded = expandFieldValues(op.data);
              db._data[key] = { ...db._data[key], ...expanded };
            }
            if (op.type === "delete") delete db._data[key];
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
          if (!db._data[key]) throw new Error("Document does not exist");
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
      serverTimestamp: () => ({ _type: "serverTimestamp" }),
      arrayUnion: (...vals) => ({ _type: "arrayUnion", vals }),
      arrayRemove: (...vals) => ({ _type: "arrayRemove", vals }),
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
    currentUser: { uid: "test-user" },
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

// Enhance module require to ensure auth/firestore helper functions exist for tests.
// This runs after the earlier require proxy so we wrap the current Module.prototype.require.
(() => {
  const Module = require("module");
  const currentRequire = Module.prototype.require;
  Module.prototype.require = function (request) {
    // Ensure firebase/auth exposes connectAuthEmulator in tests
    if (request === "firebase/auth") {
      try {
        const orig = currentRequire.apply(this, [request]);
        if (!orig.connectAuthEmulator) orig.connectAuthEmulator = jest.fn();
        return orig;
      } catch (e) {
        return { connectAuthEmulator: jest.fn(), createUserWithEmailAndPassword: jest.fn(), signInWithEmailAndPassword: jest.fn(), signOut: jest.fn(), updateProfile: jest.fn(), sendPasswordResetEmail: jest.fn() };
      }
    }

    // Ensure firebase/firestore query helpers exist (query, where, orderBy, getDocs)
    if (request === "firebase/firestore" || request === "@firebase/firestore") {
      try {
        const orig = currentRequire.apply(this, [request]);

        if (!orig.where) {
          orig.where = (field, op, value) => ({ _clause: { type: "where", field, op, value } });
        }
        if (!orig.orderBy) {
          orig.orderBy = (field, dir = "asc") => ({ _clause: { type: "orderBy", field, dir } });
        }
        if (!orig.limit) {
          orig.limit = (count) => ({ _clause: { type: "limit", count } });
        }
        if (!orig.query) {
          orig.query = (collectionRef, ...clauses) => {
            const collectionPath = (collectionRef && (collectionRef._path || collectionRef.path)) || collectionRef;
            const filters = clauses.map((c) => (c && c._clause) || c);
            return {
              _collectionPath: collectionPath,
              _filters: filters,
              async get() {
                let q = global.mockFirestore.collection(this._collectionPath);
                for (const cl of this._filters || []) {
                  if (cl.type === "where") q = q.where(cl.field, cl.op, cl.value);
                  if (cl.type === "orderBy") q = q.orderBy(cl.field, cl.dir);
                  if (cl.type === "limit") q = q.limit(cl.count);
                }
                return q.get();
              },
            };
          };
        }
        if (!orig.getDocs) {
          orig.getDocs = async (q) => {
            if (!q) return { empty: true, docs: [] };
            if (typeof q.get === "function") return q.get();
            return { empty: true, docs: [] };
          };
        }
        return orig;
      } catch (e) {
        return {
          where: (field, op, value) => ({ _clause: { type: "where", field, op, value } }),
          orderBy: (field, dir = "asc") => ({ _clause: { type: "orderBy", field, dir } }),
          query: (collectionRef, ...clauses) => ({ _collectionPath: (collectionRef && (collectionRef._path || collectionRef.path)) || collectionRef, _filters: clauses, async get() { return { empty: true, docs: [] }; } }),
          getDocs: async (q) => ({ empty: true, docs: [] }),
        };
      }
    }

    return currentRequire.apply(this, arguments);
  };
})();

// Expose firebase-auth mock helpers globally so tests can call __resetAuthMock() and __getUsers()
try {
  // Require the mock directly (relative to this setup file)
  const authMock = require("./src/__mocks__/firebase-auth.ts");
  if (authMock) {
    if (typeof authMock.__resetAuthMock === "function") {
      global.__resetAuthMock = authMock.__resetAuthMock;
      if (typeof globalThis !== "undefined") globalThis.__resetAuthMock = global.__resetAuthMock;
      try {
        if (typeof window !== "undefined") window.__resetAuthMock = global.__resetAuthMock;
      } catch (e) {
        // ignore when window isn't available
      }
    }
    // Provide a getter for test code to inspect mock users (returns shallow copy to avoid accidental mutation)
    global.__getUsers = () => Object.assign({}, authMock.__mockUsers || {});
    if (typeof globalThis !== "undefined") globalThis.__getUsers = global.__getUsers;
    try {
      if (typeof window !== "undefined") window.__getUsers = global.__getUsers;
    } catch (e) {
      // ignore when window isn't available
    }
  }
} catch (e) {
  // ignore if mock not available in this environment
}
