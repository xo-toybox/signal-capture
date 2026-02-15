import { vi, beforeEach } from 'vitest';
import { getSupabaseServerMock, resetMocks } from './mocks/supabase';

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase-server', () => getSupabaseServerMock());

beforeEach(() => {
  resetMocks();
});
