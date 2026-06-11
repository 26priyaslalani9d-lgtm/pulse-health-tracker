/**
 * Platform-neutral entry for the HealthService abstraction.
 *
 * Metro resolves `./HealthService` to `HealthService.ios.ts` on iOS and
 * `HealthService.android.ts` on Android. This `.ts` file is what TypeScript
 * (and web/node tooling) sees — it must export the exact same shape, and it
 * falls back to the mock engine, which is the correct behaviour everywhere
 * a real health store doesn't exist.
 */

import mockHealthService from './MockHealthService';
import type { HealthService } from '@/types/health';

export type { HealthService } from '@/types/health';

export const healthService: HealthService = mockHealthService;

export default healthService;
