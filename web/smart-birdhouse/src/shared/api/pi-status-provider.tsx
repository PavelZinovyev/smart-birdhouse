/**
 * Провайдер статуса Pi: один опрос /api/pi/status с общим интервалом.
 */

import type { ReactNode } from 'react';
import { usePiStatus } from '../hooks/use-pi-power';
import { PiStatusContext } from './pi-status-context';
import { REFETCH_INTERVAL_PI_STATUS_MS } from '@/shared/constants/query';
import { useSyncPiTimeWhenPiOn } from '../hooks/use-sync-pi-timer-when-pi-on';

export function PiStatusProvider({ children }: { children: ReactNode }) {
  const value = usePiStatus(REFETCH_INTERVAL_PI_STATUS_MS);
  const piOn = value.data?.pi_power ?? false;
  useSyncPiTimeWhenPiOn(piOn);
  return <PiStatusContext.Provider value={value}>{children}</PiStatusContext.Provider>;
}
