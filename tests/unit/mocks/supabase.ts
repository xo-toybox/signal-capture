import { vi } from 'vitest';

type User = { id: string; email: string };

let currentUser: User | null = null;
let queryResult: { data: unknown; error: unknown } = { data: null, error: null };

let lastInsertData: unknown = null;
let lastEqCall: [string, unknown] | null = null;
let lastRangeCall: [number, number] | null = null;
let lastFromTable: string | null = null;
let lastFromClient: 'server' | 'service' | null = null;
let serviceChainCalls: { method: string; args: unknown[] }[] = [];

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

export function getServiceChainCalls() {
  return serviceChainCalls;
}

function createChainProxy(onCall?: (method: string, args: unknown[]) => void) {
  const chain: Record<string, unknown> = new Proxy({}, {
    get(_, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(queryResult);
      }
      if (prop === 'insert') {
        return (data: unknown) => { lastInsertData = data; onCall?.('insert', [data]); return chain; };
      }
      if (prop === 'eq') {
        return (col: string, val: unknown) => { lastEqCall = [col, val]; onCall?.('eq', [col, val]); return chain; };
      }
      if (prop === 'range') {
        return (start: number, end: number) => { lastRangeCall = [start, end]; onCall?.('range', [start, end]); return chain; };
      }
      return (...args: unknown[]) => { onCall?.(String(prop), args); return chain; };
    },
  });
  return chain;
}

function createFrom(client: 'server' | 'service') {
  return (table: string) => {
    lastFromTable = table;
    lastFromClient = client;
    const onCall = client === 'service'
      ? (method: string, args: unknown[]) => { serviceChainCalls.push({ method, args }); }
      : undefined;
    return createChainProxy(onCall);
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
    createQueryClient: vi.fn().mockImplementation(() => {
      return Promise.resolve({ from: createFrom('server') });
    }),
    getUser: vi.fn().mockImplementation(() => Promise.resolve(currentUser)),
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
  serviceChainCalls = [];
}
