import { createContext, useContext } from 'react';
import type { usePiStatus } from '../hooks/use-pi-power';

export type PiStatusValue = ReturnType<typeof usePiStatus>;

export const PiStatusContext = createContext<PiStatusValue | null>(null);

export function usePiStatusContext(): PiStatusValue {
  const value = useContext(PiStatusContext);
  if (value === null) {
    throw new Error('usePiStatusContext must be used within PiStatusProvider');
  }
  return value;
}
