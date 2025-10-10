const admin = {
  apps: [],
  initializeApp: jest.fn(() => {
    admin.apps = [{}];
    return admin.apps[0];
  }),
  firestore: jest.fn(() => {
    // minimal firestore mock compatible with server-helpers usage
    const _data = new Map();
    return {
      collection(path) {
        return {
          _path: path,
          doc(id) {
            return {
              _path: path,
              id,
              get: async () => {
                const col = _data.get(path) || new Map();
                const exists = col.has(id);
                return {
                  exists: () => exists,
                  data: () => (exists ? col.get(id) : undefined),
                };
              },
              update: async (d) => {
                if (!_data.has(path)) _data.set(path, new Map());
                const col = _data.get(path);
                const prev = col.get(id) || {};
                col.set(id, { ...prev, ...d });
              },
              delete: async () => {
                if (_data.has(path)) _data.get(path).delete(id);
              },
            };
          },
          add: async (data) => {
            if (!_data.has(path)) _data.set(path, new Map());
            const id = `doc_${Math.random().toString(36).slice(2, 9)}`;
            _data.get(path).set(id, data);
            return { id, get: async () => ({ exists: () => true, data: () => data }) };
          },
          where: () => ({
            orderBy: () => ({
              limit: () => ({ get: async () => ({ docs: [] }) }),
            }),
            get: async () => ({ docs: [] }),
          }),
        };
      },
      batch() {
        const ops = [];
        return {
          delete(ref) {
            ops.push({ op: "delete", ref });
          },
          update(ref, data) {
            ops.push({ op: "update", ref, data });
          },
          commit: async () => {
            for (const o of ops) {
              if (o.op === "delete") {
                // no-op in mock
              } else if (o.op === "update") {
                // no-op
              }
            }
          },
        };
      },
    };
  }),
  firestoreFieldValue: {
    increment: (n) => ({ _increment: n }),
  },
  auth: jest.fn(() => ({})),
};

module.exports = admin;
