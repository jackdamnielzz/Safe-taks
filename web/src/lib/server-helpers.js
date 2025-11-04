/**
 * Minimal server-helpers shim for tests.
 * This file exists so imports like 'lib/server-helpers' resolve during Jest runs.
 *
 * Extended: added in-memory store and chainable query helpers (where, orderBy, limit, get, forEach)
 * so runtime routes can query seeded documents when using the stub in dev.
 */

const inMemoryStore = {
  organizations: {}, // organizations[orgId] = { lmras: {id: doc}, stopWorkAlerts: {id: doc}, ... }
};

/* eslint-disable import/no-commonjs */
// Load persistent dev seed file when available (web/.dev-seed.json)
// This allows the running Next.js dev server to see seeded LMRAs and alerts.
try {
  const fs = require('fs');
  const path = require('path');
  const seedPath = path.join(__dirname, '..', '..', '.dev-seed.json');
  if (fs.existsSync(seedPath)) {
    const raw = fs.readFileSync(seedPath, 'utf8');
    const seed = JSON.parse(raw);
    if (seed && seed.lmras) {
      // ensure test-org exists
      if (!inMemoryStore.organizations['test-org']) {
        inMemoryStore.organizations['test-org'] = { lmras: {}, stopWorkAlerts: {} };
      }
      const orgNode = inMemoryStore.organizations['test-org'];
      // merge lmras
      for (const [id, doc] of Object.entries(seed.lmras)) {
        orgNode.lmras[id] = Object.assign({}, doc);
      }
      // merge stopWorkAlerts if present
      if (seed.stopWorkAlerts) {
        for (const [id, doc] of Object.entries(seed.stopWorkAlerts)) {
          orgNode.stopWorkAlerts[id] = Object.assign({}, doc);
        }
      }
    }
  }
} catch (e) {
  // swallow errors in dev to avoid crashing server
  // console.warn('Could not load .dev-seed.json', e);
}
/* eslint-enable import/no-commonjs */

function makeDoc(id, collectionName, parentPath = []) {
  const path = [...parentPath, collectionName, id];
  return {
    id,
    collection: (subName) => ({
      doc: (subId) => makeDoc(subId, subName, path),
      where: () => ({ get: async () => ({ docs: [] }) }),
      orderBy: () => ({ get: async () => ({ docs: [] }) }),
      get: async () => {
        // navigate inMemoryStore based on path
        try {
          let node = inMemoryStore;
          for (let i = 0; i < path.length; i += 2) {
            const col = path[i];
            const docId = path[i + 1];
            if (!node[col] || !node[col][docId]) return { exists: false, data: () => null, id };
            node = node[col][docId];
          }
          // after walking, node should be the document object
          return { exists: true, data: () => node, id };
        } catch (e) {
          return { exists: false, data: () => null, id };
        }
      },
      set: async (data) => {
        // set at path -> collectionName -> id
        let node = inMemoryStore;
        for (let i = 0; i < path.length; i += 2) {
          const col = path[i];
          const docId = path[i + 1];
          if (!node[col]) node[col] = {};
          if (!node[col][docId]) node[col][docId] = {};
          node = node[col][docId];
        }
        // set fields on node
        Object.assign(node, data);
        return {};
      },
      update: async (data) => {
        let node = inMemoryStore;
        for (let i = 0; i < path.length; i += 2) {
          const col = path[i];
          const docId = path[i + 1];
          if (!node[col] || !node[col][docId]) throw new Error("Document does not exist");
          node = node[col][docId];
        }
        Object.assign(node, data);
        return {};
      },
      delete: async () => {
        try {
          let node = inMemoryStore;
          for (let i = 0; i < path.length - 2; i += 2) {
            const col = path[i];
            const docId = path[i + 1];
            if (!node[col] || !node[col][docId]) return {};
            node = node[col][docId];
          }
          const lastCol = path[path.length - 2];
          const lastId = path[path.length - 1];
          if (node[lastCol]) delete node[lastCol][lastId];
          return {};
        } catch (e) {
          return {};
        }
      },
    }),
    get: async () => ({ exists: false, data: () => null }),
    set: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  };
}

function makeCollection(name, parentPath = []) {
  const collectionPath = [...parentPath, name];
  const query = {
    doc: (id) => makeDoc(id, name, parentPath),
    where: (field, op, value) => {
      return {
        orderBy: () => ({
          limit: (n) => ({
            get: async () => {
              // simple where+orderBy+limit implementation over inMemoryStore
              // navigate to collection root
              try {
                let node = inMemoryStore;
                for (let i = 0; i < parentPath.length; i += 2) {
                  const col = parentPath[i];
                  const docId = parentPath[i + 1];
                  if (!node[col] || !node[col][docId]) return { docs: [] };
                  node = node[col][docId];
                }
                const colRoot = node[name] || {};
                const docs = Object.entries(colRoot)
                  .map(([id, data]) => ({ id, data: () => data }))
                  .filter((d) => {
                    // support simple equality only
                    if (op === "==") {
                      const parts = field.split(".");
                      let v = d.data();
                      for (const p of parts) {
                        if (v == null) return false;
                        v = v[p];
                      }
                      return v === value;
                    }
                    return false;
                  })
                  .slice(0, n || undefined);
                return { docs };
              } catch (e) {
                return { docs: [] };
              }
            },
          }),
        }),
        get: async () => {
          try {
            let node = inMemoryStore;
            for (let i = 0; i < parentPath.length; i += 2) {
              const col = parentPath[i];
              const docId = parentPath[i + 1];
              if (!node[col] || !node[col][docId]) return { docs: [] };
              node = node[col][docId];
            }
            const colRoot = node[name] || {};
            const docs = Object.entries(colRoot).map(([id, data]) => ({ id, data: () => data }));
            return { docs };
          } catch (e) {
            return { docs: [] };
          }
        },
      };
    },
    orderBy: (field) => ({
      limit: (n) => ({
        get: async () => {
          try {
            let node = inMemoryStore;
            for (let i = 0; i < parentPath.length; i += 2) {
              const col = parentPath[i];
              const docId = parentPath[i + 1];
              if (!node[col] || !node[col][docId]) return { docs: [] };
              node = node[col][docId];
            }
            const colRoot = node[name] || {};
            const docs = Object.entries(colRoot)
              .map(([id, data]) => ({ id, data: () => data }))
              .slice(0, n || undefined);
            return { docs };
          } catch (e) {
            return { docs: [] };
          }
        },
      }),
    }),
    get: async () => {
      try {
        let node = inMemoryStore;
        for (let i = 0; i < parentPath.length; i += 2) {
          const col = parentPath[i];
          const docId = parentPath[i + 1];
          if (!node[col] || !node[col][docId]) return { docs: [] };
          node = node[col][docId];
        }
        const colRoot = node[name] || {};
        const docs = Object.entries(colRoot).map(([id, data]) => ({ id, data: () => data }));
        return { docs };
      } catch (e) {
        return { docs: [] };
      }
    },
  };

  return query;
}

// Helper to get top-level org collection
function getOrCreateOrg(orgId) {
  if (!inMemoryStore.organizations[orgId]) {
    inMemoryStore.organizations[orgId] = { lmras: {}, stopWorkAlerts: {} };
  }
  return inMemoryStore.organizations[orgId];
}

module.exports = {
  /**
   * requireOrgAuth - compatibility shim used in dev/tests.
   *
   * This function supports two calling patterns:
   * 1) Middleware style: requireOrgAuth(req, res, next) -> calls next()
   * 2) Wrapper style: const auth = await requireOrgAuth(req) -> returns an auth-like object
   *
   * The real production implementation differs; this shim provides a safe fallback.
   */
  requireOrgAuth: async function (req, res, next) {
    // If called as middleware with a next() callback, call it.
    if (typeof next === 'function') {
      try {
        return next();
      } catch (e) {
        // swallow for tests/dev
        return;
      }
    }

    // Otherwise act as a function returning a minimal auth context
    // e.g. const auth = await requireOrgAuth(req);
    return {
      userId: (req && req.user && req.user.uid) || 'dev-user',
      orgId: 'test-org',
      role: 'field_worker',
      email: (req && req.user && req.user.email) || 'dev@example.com',
      emailVerified: true,
    };
  },
  getOrgIdFromRequest: () => 'test-org',
  // Minimal initializeAdmin stub expected by server-side routes/tests
  initializeAdmin: () => {
    // Ensure latest dev seed is merged on each initializeAdmin call.
    // This addresses the Next.js dev server multi-process instance problem
    // by reloading web/.dev-seed.json for the current process on each request.
    try {
      const fs = require('fs');
      const path = require('path');
      const seedPath = path.join(__dirname, '..', '..', '.dev-seed.json');
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, 'utf8');
        const seed = JSON.parse(raw);
        if (seed && seed.lmras) {
          if (!inMemoryStore.organizations['test-org']) {
            inMemoryStore.organizations['test-org'] = { lmras: {}, stopWorkAlerts: {} };
          }
          const orgNode = inMemoryStore.organizations['test-org'];
          for (const [id, doc] of Object.entries(seed.lmras)) {
            orgNode.lmras[id] = Object.assign({}, doc);
          }
          if (seed.stopWorkAlerts) {
            for (const [id, doc] of Object.entries(seed.stopWorkAlerts)) {
              orgNode.stopWorkAlerts[id] = Object.assign({}, doc);
            }
          }
        }
      }
    } catch (e) {
      // swallow in dev
    }

    // Return a minimal stubbed admin API surface expected by server routes.
    // Routes typically destructure { firestore, auth, storage } from this.
    // Make a chainable doc/collection stub for firestore

    const firestoreStub = {
      collection: (name) => {
        // If requesting organizations top-level, return a collection that reads/writes inMemoryStore
        if (name === 'organizations') {
          return makeCollection(name, []);
        }
        return makeCollection(name, []);
      },
    };

    const authStub = {
      getUser: async (uid) => ({ uid, email: `${uid}@example.com` }),
    };

    const storageStub = {
      bucket: () => ({
        file: () => ({
          save: async () => ({}),
          download: async () => Buffer.from(''),
        }),
      }),
    };

    return { firestore: firestoreStub, auth: authStub, storage: storageStub };
  },
  // Also export initializeAdmin as a top-level function for ESM / named import compatibility
  // so modules that do: const { initializeAdmin } = require('lib/server-helpers') or import { initializeAdmin } from 'lib/server-helpers' will get a function.
  get initializeAdminFunction() {
    return this.initializeAdmin;
  },
  // Expose the inMemoryStore for debugging in dev if needed
  __inMemoryStore: inMemoryStore,
};
