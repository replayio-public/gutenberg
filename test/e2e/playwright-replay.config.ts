/**
 * External dependencies
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';
import { devices as replayDevices } from '@replayio/playwright';

const STORAGE_STATE_PATH =
	process.env.STORAGE_STATE_PATH ||
	path.join( process.cwd(), 'artifacts/storage-states/admin.json' );

const config: PlaywrightTestConfig = {
	reporter: process.env.CI
		? [ [ 'github' ], [ './config/flaky-tests-reporter.ts' ] ]
		: 'list',
	forbidOnly: !! process.env.CI,
	workers: 1,
	retries: process.env.CI ? 2 : 0,
	timeout: parseInt( process.env.TIMEOUT || '', 10 ) || 100_000, // Defaults to 100 seconds.
	// Don't report slow test "files", as we will be running our tests in serial.
	reportSlowTests: null,
	testDir: fileURLToPath( new URL( './specs', 'file:' + __filename ).href ),
	outputDir: path.join( process.cwd(), 'artifacts/test-results' ),
	globalSetup: fileURLToPath(
		new URL( './config/global-setup.ts', 'file:' + __filename ).href
	),
	use: {
		baseURL: process.env.WP_BASE_URL || 'http://localhost:8889',
		headless: true,
		viewport: {
			width: 960,
			height: 700,
		},
		ignoreHTTPSErrors: true,
		locale: 'en-US',
		contextOptions: {
			reducedMotion: 'reduce',
			strictSelectors: true,
		},
		storageState: STORAGE_STATE_PATH,
		actionTimeout: 10_000, // 10 seconds.
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'on-first-retry',
	},
	webServer: {
		command: 'npm run wp-env start',
		port: 8889,
		timeout: 120_000, // 120 seconds.
		reuseExistingServer: true,
	},
	projects: [
		// {
		// 	name: 'replay-firefox',
		// 	use: { ...( replayDevices[ 'Replay Firefox' ] as any ) },
		// },
		{
			name: 'chromium',
			use: { ...( replayDevices[ 'Replay Chromium' ] as any ) },
		},
		// {
		// 	name: 'firefox',
		// 	use: { ...devices[ 'Desktop Firefox' ] },
		// },
		// {
		// 	name: 'chromium',
		// 	use: { ...devices[ 'Desktop Chromium' ] },
		// },
	],
};

export default config;
