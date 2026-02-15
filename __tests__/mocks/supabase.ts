import { vi } from 'vitest';

type User = { id: string; email: string };

let currentUser: User | null = null;
let serviceQueryResult: { data: unknown; error: unknown } = { data: null, error: null };

let lastInsertData: unknown = null;
let lastEqCall: [string, unknown] | null = null;
let lastRangeCall: [number, number] | null = null;
let lastFromTable: string | null = null;

export function mockAuth(user: User | null) {
  currentUser = user;
}

export function mockServiceClient(result: { data?: unknown; error?: unknown } = {}) {
  serviceQueryResult = { data: result.data ?? null, error: result.error ?? null };
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

function createQueryBuilder() {
  const proxy: Record<string, unknown> = new Proxy({} as Record<string, unknown>, {
    get(_, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(serviceQueryResult);
      }
      if (prop === 'from') {
        return (table: string) => { lastFromTable = table; return proxy; };
      }
      if (prop === 'insert') {
        return (data: unknown) => { lastInsertData = data; return proxy; };
      }
      if (prop === 'eq') {
        return (col: string, val: unknown) => { lastEqCall = [col, val]; return proxy; };
      }
      if (prop === 'range') {
        return (start: number, end: number) => { lastRangeCall = [start, end]; return proxy; };
      }
      return vi.fn().mockReturnValue(proxy);
    },
  });
  return proxy;
}

export function getSupabaseServerMock() {
  return {
    createServerClient: vi.fn().mockImplementation(() =>
      Promise.resolve({
        auth: {
          getUser: vi.fn().mockImplementation(() =>
            Promise.resolve({ data: { user: currentUser } })
          ),
        },
      })
    ),
    createServiceClient: vi.fn().mockImplementation(() => createQueryBuilder()),
    isConfigured: true,
  };
}

export function resetMocks() {
  currentUser = null;
  serviceQueryResult = { data: null, error: null };
  lastInsertData = null;
  lastEqCall = null;
  lastRangeCall = null;
  lastFromTable = null;
}
