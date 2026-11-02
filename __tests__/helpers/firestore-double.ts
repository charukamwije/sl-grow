import { vi } from "vitest";

/**
 * A stand-in for `adminDb`, covering only what the routes touch:
 * `collection().doc().collection()` to reach a user's documents, `get`/`set`
 * for the cart, `add` for orders and plans, `runTransaction` for the cart
 * merge, and `recursiveDelete` for the account-deletion sweep. Every ref
 * built by the chain carries its joined path, and the spies are called with
 * that path, so tests can assert exactly which document was touched instead
 * of trusting the chain was built correctly. `set` writes to an in-memory
 * map that `get` reads back.
 */
export type FirestoreRef = {
  path: string;
  collection(name: string): FirestoreRef;
  doc(id: string): FirestoreRef;
  add(data: unknown): Promise<unknown>;
  set(data: Record<string, unknown>): Promise<unknown>;
  get(): Promise<{ exists: boolean; get(field: string): unknown }>;
  delete(): Promise<unknown>;
};

function createFirestoreDouble() {
  const docs = new Map<string, Record<string, unknown>>();
  const add = vi.fn();
  const set = vi.fn();
  const del = vi.fn();
  const recursiveDelete = vi.fn();

  function makeRef(path: string): FirestoreRef {
    return {
      path,
      collection: (name: string) => makeRef(`${path}/${name}`),
      doc: (id: string) => makeRef(`${path}/${id}`),
      add: (data: unknown) => add(path, data),
      set: async (data: Record<string, unknown>) => {
        await set(path, data);
        docs.set(path, data);
      },
      get: async () => {
        const data = docs.get(path);
        return { exists: data !== undefined, get: (field: string) => data?.[field] };
      },
      delete: () => del(path),
    };
  }

  return {
    adminDb: {
      collection: (name: string) => makeRef(name),
      recursiveDelete: (ref: FirestoreRef) => recursiveDelete(ref.path),
      runTransaction: async <T>(
        update: (transaction: {
          get: (ref: FirestoreRef) => ReturnType<FirestoreRef["get"]>;
          set: (ref: FirestoreRef, data: Record<string, unknown>) => void;
        }) => Promise<T>
      ) => {
        const writes: [FirestoreRef, Record<string, unknown>][] = [];
        const result = await update({
          get: (ref) => ref.get(),
          set: (ref, data) => void writes.push([ref, data]),
        });
        // Like Firestore, writes land only once the update function succeeds
        for (const [ref, data] of writes) await ref.set(data);
        return result;
      },
    },
    docs,
    add,
    set,
    delete: del,
    recursiveDelete,
    reset() {
      docs.clear();
      add.mockReset().mockResolvedValue({ id: "new-doc" });
      set.mockReset().mockResolvedValue(undefined);
      del.mockReset().mockResolvedValue(undefined);
      recursiveDelete.mockReset().mockResolvedValue(undefined);
    },
  };
}

// One instance per test file - Vitest gives each file its own module registry,
// so the mock factory and the test body see the same double without leaking
// between files.
export const firestoreDouble = createFirestoreDouble();
