import { defineConfig } from '@playwright/test';
import { execSync } from 'child_process';

/**
 * Read credentials from the local Supabase instance.
 * Requires `supabase start` to have been run first.
 */
function getLocalSupabaseEnv() {
  try {
    const raw = execSync('supabase status -o json', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const s = JSON.parse(raw);
    return {
      NEXT_PUBLIC_SUPABASE_URL: s.API_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: s.ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: s.SERVICE_ROLE_KEY,
    };
  } catch {
    console.error(
      '\n  Local Supabase is not running.\n' +
      '  Start it first:  supabase start\n',
    );
    process.exit(1);
  }
}

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3001',
  },
  webServer: {
    command: 'npx next dev --port 3001',
    port: 3001,
    reuseExistingServer: false,
    env: getLocalSupabaseEnv(),
  },
});
