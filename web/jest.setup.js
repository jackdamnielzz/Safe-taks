// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return {
      get: jest.fn(),
      getAll: jest.fn(),
      has: jest.fn(),
      entries: jest.fn(),
      forEach: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
    };
  },
  usePathname() {
    return "/";
  },
  useParams() {
    return {};
  },
}));

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ""} />;
  },
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  const Link = ({ children, href, ...props }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
  Link.displayName = "Link";
  return Link;
});

// Mock Firebase
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({
    name: "test-app",
  })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({
    name: "test-app",
  })),
}));

jest.mock("firebase/auth", () => {
  // Minimal in-memory auth mock for Jest tests
  const users = new Map(); // email -> { uid, email, password }
  let currentUser = null;

  function getAuth() {
    return {
      currentUser,
      onAuthStateChanged: jest.fn(),
    };
  }

  async function createUserWithEmailAndPassword(auth, email, password) {
    // Basic validation to mimic Firebase Auth behavior used in tests
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const err = new Error("The email address is badly formatted.");
      err.code = "auth/invalid-email";
      throw err;
    }

    if (typeof password !== "string" || password.length < 6) {
      const err = new Error("Password should be at least 6 characters");
      err.code = "auth/weak-password";
      throw err;
    }

    if (users.has(email)) {
      const err = new Error("The email address is already in use by another account.");
      err.code = "auth/email-already-in-use";
      throw err;
    }

    const uid = `uid_${Math.random().toString(36).slice(2, 9)}`;
    const user = { uid, email, password };
    users.set(email, user);
    currentUser = { uid, email, emailVerified: false };
    return { user: currentUser };
  }

  async function signInWithEmailAndPassword(auth, email, password) {
    const user = users.get(email);
    if (!user || user.password !== password) {
      const err = new Error("Invalid credentials");
      // mimic FirebaseAuth error shape
      err.code = "auth/wrong-password";
      throw err;
    }
    currentUser = { uid: user.uid, email: user.email };
    return { user: currentUser };
  }

  async function signOut(auth) {
    currentUser = null;
    return;
  }

  function connectAuthEmulator(auth, url) {
    // no-op in Jest environment
    return;
  }

  async function sendPasswordResetEmail(auth, email) {
    // In emulator/mock: resolve for existing user, reject for non-existent
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const err = new Error("The email address is badly formatted.");
      err.code = "auth/invalid-email";
      throw err;
    }

    // Special case: auto-create test@example.com if missing (mimics emulator test behavior)
    if (email === "test@example.com" && !users.has(email)) {
      const uid = `uid_${Math.random().toString(36).slice(2, 9)}`;
      users.set(email, { uid, email, password: "password123" });
    }

    const user = users.get(email);
    if (!user) {
      const err = new Error("There is no user record corresponding to this identifier.");
      err.code = "auth/user-not-found";
      throw err;
    }
    // Simulate async success
    return;
  }

  return {
    getAuth: jest.fn(() => getAuth()),
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn((auth, email, pass) =>
      signInWithEmailAndPassword(auth, email, pass)
    ),
    createUserWithEmailAndPassword: jest.fn((auth, email, pass) =>
      createUserWithEmailAndPassword(auth, email, pass)
    ),
    signOut: jest.fn((auth) => signOut(auth)),
    sendPasswordResetEmail: jest.fn((auth, email) => sendPasswordResetEmail(auth, email)),
    connectAuthEmulator: jest.fn((auth, url) => connectAuthEmulator(auth, url)),
    // Testing helper to reset mock internal state between tests
    clearAllUsers: jest.fn(() => {
      users.clear();
      currentUser = null;
    }),
  };
});

// Provide a unified in-memory Firestore mock and ensure connectFirestoreEmulator exists.
// We used to mock connectFirestoreEmulator separately which caused it to be overwritten by
// the full in-memory mock below; combine them so tests calling connectFirestoreEmulator work.
jest.mock("firebase/firestore", () => {
  // In-memory minimal Firestore mock used in Jest tests.
  // Supports: collection, doc, setDoc/getDoc, addDoc, getDocs, query/where, deleteDoc
  const _data = new Map(); // Map<collectionPath, Map<docId, docData>>

  function collection(db, path) {
    return { _collectionPath: path };
  }

  function doc(db, pathOrColl, id) {
    if (id === undefined) {
      // doc(db, 'collection/docId') usage
      const parts = pathOrColl.split("/");
      const col = parts.slice(0, -1).join("/");
      const docId = parts[parts.length - 1];
      return { _collectionPath: col, id: docId };
    }
    return { _collectionPath: pathOrColl, id };
  }

  async function setDoc(ref, data) {
    const col = ref._collectionPath;
    const id = ref.id;
    if (!col || !id) throw new Error("Invalid doc ref in setDoc");
    if (!_data.has(col)) _data.set(col, new Map());
    _data.get(col).set(id, { ...data });
    return;
  }

  async function getDoc(ref) {
    const col = ref._collectionPath;
    const id = ref.id;
    const exists = Boolean(_data.has(col) && _data.get(col).has(id));
    const data = exists ? _data.get(col).get(id) : undefined;
    return {
      exists: () => exists,
      data: () => data,
    };
  }

  async function addDoc(collRef, data) {
    const col = collRef._collectionPath;
    if (!_data.has(col)) _data.set(col, new Map());
    const id = `doc_${Math.random().toString(36).slice(2, 9)}`;
    _data.get(col).set(id, { ...data });
    return { id };
  }

  async function getDocs(queryRef) {
    // Supports: query(collection) and query(collection, where(...))
    const col =
      queryRef._collectionPath ||
      (queryRef && queryRef.collection && queryRef.collection._collectionPath) ||
      null;
    if (!col || !_data.has(col)) {
      return { size: 0, docs: [], forEach: (fn) => {} };
    }

    let docs = [];
    for (const [id, docData] of _data.get(col).entries()) {
      docs.push({ id, data: () => docData });
    }

    // Apply simple where clause filtering if present
    if (queryRef && Array.isArray(queryRef.clauses) && queryRef.clauses.length > 0) {
      for (const clause of queryRef.clauses) {
        if (clause && clause.type === "where") {
          const { field, op, value } = clause;
          if (op === "==") {
            docs = docs.filter((d) => {
              const row = d.data();
              return row && row[field] === value;
            });
          }
          // other ops can be added as needed
        }
      }
    }

    return {
      size: docs.length,
      docs,
      forEach: (fn) => docs.forEach(fn),
    };
  }

  function query(coll, ...clauses) {
    // attach collection path and where clauses for getDocs handler
    const q = { _collectionPath: coll._collectionPath, clauses };
    return q;
  }

  function where(field, op, value) {
    return { type: "where", field, op, value };
  }

  async function deleteDoc(ref) {
    const col = ref._collectionPath;
    const id = ref.id;
    if (_data.has(col)) _data.get(col).delete(id);
    return;
  }

  // Provide a no-op connectFirestoreEmulator so tests that call it don't fail.
  function connectFirestoreEmulator(db, host, port) {
    // no-op in Jest environment
    return;
  }

  return {
    getFirestore: jest.fn(() => ({})),
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc: jest.fn(), // not needed in tests currently
    deleteDoc,
    query,
    where,
    orderBy: jest.fn(),
    limit: jest.fn(),
    onSnapshot: jest.fn(),
    connectFirestoreEmulator,
  };
});

// Global test environment setup
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock matchMedia for tests that use responsive components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(global, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// Minimal fetch polyfill for modules that call fetch during initialization.
// Keeps tests isolated and avoids adding external dependencies.
if (typeof global.fetch === "undefined") {
  global.fetch = async function mockFetch(input, init = {}) {
    return {
      ok: true,
      status: 200,
      json: async () => {
        try {
          if (init && init.body) return JSON.parse(init.body);
        } catch {
          /* ignore */
        }
        return {};
      },
      text: async () => (init && init.body ? String(init.body) : ""),
      headers: {
        get: () => null,
      },
    };
  };
}

// Minimal global Request/NextRequest/NextResponse polyfills for Jest environment
// Some modules import or reference Request/NextRequest at runtime; ensure they exist before imports.
if (typeof global.Request === "undefined") {
  global.Request = class MockRequest {
    constructor(input = "", init = {}) {
      this.input = input;
      this.init = init;
      this.method = init.method || "GET";
      this.headers = init.headers || {};
      this.url = typeof input === "string" ? input : (input && input.url) || "";
    }
    json() {
      return Promise.resolve(this.init.body ? JSON.parse(this.init.body) : {});
    }
    text() {
      return Promise.resolve(this.init.body ? String(this.init.body) : "");
    }
  };
}

if (typeof global.NextRequest === "undefined") {
  global.NextRequest = class MockNextRequest extends global.Request {
    constructor(input, init) {
      super(input, init);
    }
  };
}

if (typeof global.NextResponse === "undefined") {
  global.NextResponse = class MockNextResponse {
    static json(payload, opts = {}) {
      return { __mock: true, payload, opts };
    }
    static redirect(url, status = 307) {
      return { __mock_redirect: true, url, status };
    }
  };
}

// Polyfill Response used by some Next/server helpers during tests
if (typeof global.Response === "undefined") {
  global.Response = class MockResponse {
    constructor(body = null, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.headers = init.headers || {};
      this.ok = this.status >= 200 && this.status < 300;
    }
    async json() {
      if (typeof this.body === "string") {
        try {
          return JSON.parse(this.body);
        } catch {
          return this.body;
        }
      }
      return this.body;
    }
    async text() {
      if (typeof this.body === "string") return this.body;
      return JSON.stringify(this.body);
    }
  };
}

// Set up global test timeout
jest.setTimeout(10000);

/**
 * Clean up after each test
 *
 * Reset mocks and in-memory auth state between tests to ensure isolation.
 */
afterEach(() => {
  try {
    // call clear helper if available to reset in-memory users
    // this ensures tests that expect an existing auth user will recreate it reliably
    // and prevents cross-test contamination.

    const authMock = require("firebase/auth");
    if (authMock && typeof authMock.clearAllUsers === "function") {
      authMock.clearAllUsers();
    }
  } catch (e) {
    // ignore if require fails in some environments
  }
  jest.clearAllMocks();
});
