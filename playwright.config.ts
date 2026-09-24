import { defineConfig, devices } from '@playwright/test';

// E2E do fluxo completo sobre o build de produção (vite preview).
// Rode antes: npm run build
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  retries: 0,
  reporter: [['list']],
  use: {
    ...devices['Pixel 7'],
    baseURL: 'http://localhost:4174',
    permissions: ['microphone'],
    launchOptions: {
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
    },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
    // Sem chave Azure no ambiente de teste: a API é simulada pelo teste.
    env: { AZURE_SPEECH_KEY: '', AZURE_SPEECH_REGION: '' },
  },
});
