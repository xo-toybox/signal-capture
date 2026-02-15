import { createServerClient, createServiceClient } from '@/lib/supabase-server';

const TEST_EMAIL = 'test@signal-capture.local';
const TEST_PASSWORD = 'test-password-e2e-only';

// Dev-only: creates a test user session for Playwright E2E tests.
// POST /api/auth/test-session → sets auth cookies on the response.
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not available' }, { status: 404 });
  }

  // Create test user via admin API if it doesn't exist
  const admin = createServiceClient();
  const { data: users } = await admin.auth.admin.listUsers();
  if (!users?.users?.find(u => u.email === TEST_EMAIL)) {
    const { error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  // Sign in via cookie-based client — this sets auth cookies automatically
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
