import { vi } from 'vitest';

type User = { id: string; email: string };

let currentUser: User | null = null;
let queryResult: { data: unknown; error: unknown } = { data: null, error: null };

let lastInsertData: unknown = null;
let lastEqCall: [string, unknown] | null = null;
let lastRangeCall: [number, number] | null = null;
let lastFromTable: string | null = null;
let lastFromClient: 'server' | 'service' | null = null;

export function mockAuth(user: User | null) {
  currentUser = user;
}

export function mockQueryResult(result: { data?: unknown; error?: unknown } = {}) {
  queryResult = { data: result.data ?? null, error: result.error ?? null };
}

export function getLastInsert() {
  return lastInsertData;
}

export function getLastEq() {
  return lastEqCall;
}

export function getLastRange() {
  return lastRangeCall;
}

export function getLastFromTable() {
  return lastFromTable;
}

export function getLastFromClient() {
  return lastFromClient;
}

function createChainProxy() {
  const chain: Record<string, unknown> = new Proxy({}, {
    get(_, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(queryResult);
      }
      if (prop === 'insert') {
        return (data: unknown) => { lastInsertData = data; return chain; };
      }
      if (prop === 'eq') {
        return (col: string, val: unknown) => { lastEqCall = [col, val]; return chain; };
      }
      if (prop === 'range') {
        return (start: number, end: number) => { lastRangeCall = [start, end]; return chain; };
      }
      return vi.fn().mockReturnValue(chain);
    },
  });
  return chain;
}

function createFrom(client: 'server' | 'service') {
  return (table: string) => {
    lastFromTable = table;
    lastFromClient = client;
    return createChainProxy();
  };
}

export function getSupabaseServerMock() {
  return {
    createServerClient: vi.fn().mockImplementation(() => {
      const client = new Proxy(
        {
          auth: {
            getUser: vi.fn().mockImplementation(() =>
              Promise.resolve({ data: { user: currentUser } })
            ),
          },
        } as Record<string, unknown>,
        {
          get(target, prop) {
            if (prop in target) return target[prop as string];
            if (prop === 'then') return undefined;
            if (prop === 'from') return createFrom('server');
            return vi.fn();
          },
        }
      );
      return Promise.resolve(client);
    }),
    createServiceClient: vi.fn().mockImplementation(() => ({
      from: createFrom('service'),
    })),
    isConfigured: true,
  };
}

export function resetMocks() {
  currentUser = null;
  queryResult = { data: null, error: null };
  lastInsertData = null;
  lastEqCall = null;
  lastRangeCall = null;
  lastFromTable = null;
  lastFromClient = null;
}
