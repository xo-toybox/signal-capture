import { vi, beforeEach } from 'vitest';
import { getSupabaseServerMock, resetMocks } from './mocks/supabase';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}));

// Mock @/lib/supabase-server — delegates to our controllable mock
vi.mock('@/lib/supabase-server', () => getSupabaseServerMock());

beforeEach(() => {
  resetMocks();
});
