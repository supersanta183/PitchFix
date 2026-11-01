import { defineConfig, devices } from '@playwright/test';
import { FAKE_VOICE_WAV } from './e2e/fake-voice';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  globalSetup: './e2e/fake-voice.setup.ts',
  use: {
    baseURL: 'http://localhost:4300',
  },
  projects: [
    {
      name: 'phone-chromium',
      use: {
        ...devices['Pixel 7'],
        permissions: ['microphone'],
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
            `--use-file-for-fake-audio-capture=${FAKE_VOICE_WAV}`,
            '--autoplay-policy=no-user-gesture-required',
          ],
        },
      },
    },
  ],
  webServer: {
    command: 'npx ng serve --port 4300 --configuration production --prebundle=false',
    url: 'http://localhost:4300',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
