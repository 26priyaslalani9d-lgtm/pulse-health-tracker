/**
 * Health source resolution: real platform service vs mock engine.
 *
 * The mock is used when (any of):
 *  - the dev panel forces it,
 *  - the platform health store is unavailable (iOS Simulator, no Health Connect),
 *  - permissions are denied/unavailable.
 * The active source is reported so the UI can show the "demo data" badge.
 */

import platformService from './HealthService';
import mockHealthService from './MockHealthService';
import { debug } from '@/lib/debug';
import type { HealthService, PermissionState } from '@/types/health';

export type DataSource = 'real' | 'mock';

export interface ResolvedHealthSource {
  service: HealthService;
  source: DataSource;
  permission: PermissionState;
}

interface ResolveOptions {
  forceMock?: boolean;
}

export async function resolveHealthSource(
  options: ResolveOptions = {},
): Promise<ResolvedHealthSource> {
  if (options.forceMock) {
    return { service: mockHealthService, source: 'mock', permission: 'granted' };
  }

  const available = await platformService.isAvailable();
  if (!available) {
    debug('health', 'platform store unavailable → mock');
    return { service: mockHealthService, source: 'mock', permission: 'unavailable' };
  }

  const permission = await platformService.getPermissionState();
  if (permission === 'denied' || permission === 'unavailable') {
    debug('health', `permission ${permission} → mock`);
    return { service: mockHealthService, source: 'mock', permission };
  }

  return { service: platformService, source: 'real', permission };
}

export { mockHealthService, platformService };
export { configureMock, getMockConfig } from './MockHealthService';
export type { MockProfile } from './MockHealthService';
