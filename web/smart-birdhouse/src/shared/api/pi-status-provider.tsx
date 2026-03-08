/**
 * Провайдер статуса Pi: один опрос /api/pi/status с общим интервалом.
 */

import type { ReactNode } from 'react';
import { usePiStatus } from './use-pi-power';
import { PiStatusContext } from './pi-status-context';
import { REFETCH_INTERVAL_PI_STATUS_MS } from '@/shared/constants/query';

export function PiStatusProvider({ children }: { children: ReactNode }) {
  const value = usePiStatus(REFETCH_INTERVAL_PI_STATUS_MS);
  return <PiStatusContext.Provider value={value}>{children}</PiStatusContext.Provider>;
}
