/**
 * Minimal in-memory mock for firebase/firestore used by tests.
 * Implements getDocs, query snapshots with .size and .docs, and a Timestamp class.
 */

type DocData = Record<string, any>;
const store: Map<string, DocData> = new Map();

export class Timestamp {
  private _date: Date;
  constructor(date: Date) {
    this._date = date;
  }
  toDate() {
    return this._date;
  }
  toMillis() {
    return this._date.getTime();
  }
  static now() {
    return new Timestamp(new Date());
  }
  static fromDate(d: Date) {
    return new Timestamp(d);
  }
}

export function getFirestore() {
  return { _isMock: true };
}

function pathFromRef(ref: any) {
  if (typeof ref === "string") return ref;
  if (ref && ref._path) return ref._path;
  if (ref && ref.path) return ref.path;
  return String(ref);
}

export function collection(db: any, path: string) {
  // Match Firestore shape used in app/tests:
  // - identifiable by path
  // - consumable by query/getDocs helpers
  return { _path: path, path, type: "collection" };
}

// Minimal addDoc implementation used by tests that call addDoc(collection(db, 'col'), data)
export async function addDoc(collRef: any, data: DocData) {
  const colPath = pathFromRef(collRef);
  const id = `doc-${Math.random().toString(36).slice(2, 9)}`;
  const fullPath = `${colPath}/${id}`;
  store.set(fullPath, { ...data });
  return {
    id,
    path: fullPath,
    ref: { _path: fullPath, path: fullPath, id },
  };
}

export function doc(parent: any, id?: string) {
  if (id === undefined) {
    const randomId = `doc-${Math.random().toString(36).slice(2, 9)}`;
    return {
      _path: `${parent._path}/${randomId}`,
      id: randomId,
      path: `${parent._path}/${randomId}`,
    };
  }
  const p = parent && parent._path ? `${parent._path}/${id}` : id;
  return { _path: p, id, path: p };
}

export async function setDoc(docRef: any, data: DocData, options?: any) {
  const key = pathFromRef(docRef);
  const next = { ...data };
  if (options && options.merge) {
    const existing = store.get(key) || {};
    store.set(key, { ...existing, ...next });
  } else {
    store.set(key, next);
  }
  return Promise.resolve();
}

export async function getDoc(docRef: any) {
  const path = pathFromRef(docRef);
  const data = store.get(path);
  const exists = !!data;
  const id = typeof docRef?.id === "string" ? docRef.id : path.split("/").pop() || "";
  return Promise.resolve({
    exists: () => exists,
    data: () => data,
    id,
    ref: { _path: path, path, id },
  });
}

export function writeBatch(db?: any) {
  const ops: Array<{ type: string; path: string; data?: DocData }> = [];
  return {
    set: (ref: any, data: DocData) => {
      ops.push({ type: "set", path: pathFromRef(ref), data });
    },
    update: (ref: any, data: DocData) => {
      ops.push({ type: "update", path: pathFromRef(ref), data });
    },
    delete: (ref: any) => {
      ops.push({ type: "delete", path: pathFromRef(ref) });
    },
    commit: async () => {
      for (const op of ops) {
        if (op.type === "set") store.set(op.path, { ...op.data });
        if (op.type === "update") {
          const existing = store.get(op.path) || {};
          store.set(op.path, { ...existing, ...op.data });
        }
        if (op.type === "delete") store.delete(op.path);
      }
      return Promise.resolve();
    },
  };
}

export async function runTransaction(db: any, updateFunction: (tx: any) => Promise<any>) {
  // Transaction: clone current state, apply changes to a staging area, commit only if no error is thrown.
  const staging = new Map<string, DocData>(store);

  const tx = {
    async get(ref: any) {
      const d = staging.get(pathFromRef(ref));
      return { exists: () => !!d, data: () => d };
    },
    async set(ref: any, data: DocData) {
      staging.set(pathFromRef(ref), { ...data });
    },
    async update(ref: any, data: DocData) {
      const existing = staging.get(pathFromRef(ref)) || {};
      staging.set(pathFromRef(ref), { ...existing, ...data });
    },
    async delete(ref: any) {
      staging.delete(pathFromRef(ref));
    },
  };

  try {
    const res = await updateFunction(tx);
    // commit staging to real store
    store.clear();
    for (const [k, v] of staging.entries()) store.set(k, v);
    return Promise.resolve(res);
  } catch (e) {
    // rollback by discarding staging (store remains unchanged)
    return Promise.reject(e);
  }
}

function buildSnapshot(items: Array<{ id: string; data: any; ref: any }>) {
  const docs = items.map((it) => ({
    id: it.id,
    data: () => it.data,
    ref: it.ref,
  }));
  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach(cb: any) {
      for (const d of docs) cb(d);
    },
  };
}

// query(collectionRef, ...constraints) returns an object; tests commonly call getDocs(q)
export function query(collectionRef: any, ...constraints: any[]) {
  const colPath = collectionRef._path || collectionRef.path;
  const results: Array<{ id: string; data: any; ref: any }> = [];
  for (const [key, val] of store.entries()) {
    if (key.startsWith(colPath + "/")) {
      const id = key.slice(colPath.length + 1);
      results.push({ id, data: val, ref: { _path: key, id, path: key } });
    }
  }
  // Apply constraints similarly to previous implementation
  let items = results;
  for (const c of constraints) {
    if (!c) continue;
    if (c.type === "where") {
      // Support multiple where clauses: chain filters
      // Note: Evaluate each where against the base data so multiple wheres combine correctly.
      items = items.filter((it) => {
        const field = c.field;
        const v = it.data && it.data[field];

        // Normalize left value (handle Timestamp-like objects)
        let left = v;
        if (left && typeof left.toMillis === "function") {
          left = left.toMillis();
        }

        // Handle 'in' operator where compare value is an array
        if (c.op === "in") {
          const arr = Array.isArray(c.value) ? c.value : [];
          const normalized = arr.map((val: any) =>
            val && typeof val.toMillis === "function" ? val.toMillis() : val
          );
          return normalized.includes(left);
        }

        // Normalize compareValue for scalar comparisons
        let compareValue = c.value;
        if (compareValue && typeof compareValue.toMillis === "function") {
          compareValue = compareValue.toMillis();
        }

        switch (c.op) {
          case "==":
            return left === compareValue;
          case ">":
            return left > compareValue;
          case "<":
            return left < compareValue;
          case ">=":
            return left >= compareValue;
          case "<=":
            return left <= compareValue;
          default:
            return false;
        }
      });
    }
    if (c.type === "orderBy") {
      const field = c.field;
      const direction = (c.dir || "asc").toLowerCase();
      items = items.sort((a, b) => {
        let av = a.data ? a.data[field] : undefined;
        let bv = b.data ? b.data[field] : undefined;
        if (av && typeof av.toMillis === "function") av = av.toMillis();
        if (bv && typeof bv.toMillis === "function") bv = bv.toMillis();
        if (av === bv) return 0;
        if (av === undefined) return -1;
        if (bv === undefined) return 1;
        return direction === "asc" ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
      });
    }
    if (c.type === "limit") {
      items = items.slice(0, c.count);
    }
  }
  return {
    async get() {
      return Promise.resolve(buildSnapshot(items));
    },
    _internalItems: items,
  };
}

// Implement getDocs used by tests (works for query or collectionRef)
export async function getDocs(refOrQuery: any) {
  // If it's a query object with get(), call that.
  if (refOrQuery && typeof refOrQuery.get === "function") {
    return refOrQuery.get();
  }
  // Otherwise treat it as a collectionRef
  const colPath = refOrQuery._path || refOrQuery.path;
  const results: Array<{ id: string; data: any; ref: any }> = [];
  for (const [key, val] of store.entries()) {
    if (key.startsWith(colPath + "/")) {
      const id = key.slice(colPath.length + 1);
      results.push({ id, data: val, ref: { _path: key, id, path: key } });
    }
  }
  return Promise.resolve(buildSnapshot(results));
}

export function where(field: string, op: string, value: any) {
  return { type: "where", field, op, value };
}

export function orderBy(field: string, dir?: string) {
  return { type: "orderBy", field, dir };
}

// Helper: support snapshot.size alias for backward compatibility (already provided in buildSnapshot)

export function limit(count: number) {
  return { type: "limit", count };
}

export function deleteDoc(ref: any) {
  store.delete(pathFromRef(ref));
  return Promise.resolve();
}

export function updateDoc(ref: any, data: any) {
  const key = pathFromRef(ref);
  const existing = store.get(key);
  if (!existing) {
    // Match Firestore behavior: throw if document does not exist
    throw new Error("Document does not exist");
  }
  store.set(key, { ...existing, ...data });
  return Promise.resolve();
}

// Helper to clear store between tests
export function __clearFirestoreMock() {
  store.clear();
}

// No-op helpers to satisfy tests that call emulator connectors
export function connectFirestoreEmulator(db: any, host: string, port: number) {
  // noop in-memory
  return;
}
export function connectFunctionsEmulator(db: any, host: string, port: number) {
  return;
}
