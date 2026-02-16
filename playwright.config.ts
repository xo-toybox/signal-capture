import { defineConfig } from '@playwright/test';
import { execSync } from 'child_process';

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
    console.warn(
      '\n  Warning: Local Supabase is not running.\n' +
      '  Supabase env vars will be empty (tests will fail, but show-report/install still work).\n' +
      '  Start it first:  supabase start\n',
    );
    return {
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    };
  }
}

const E2E_PORT = Number(process.env.E2E_PORT) || 3100;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: '.test-results',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
  },
  webServer: {
    command: `bunx next dev --port ${E2E_PORT}`,
    port: E2E_PORT,
    reuseExistingServer: true,
    env: {
      ...getLocalSupabaseEnv(),
      NEXT_DIST_DIR: '.next-e2e',
      // Explicitly unset so bug-reporter "not configured" test works
      GITHUB_TOKEN: '',
      GITHUB_REPO: '',
    },
  },
});
