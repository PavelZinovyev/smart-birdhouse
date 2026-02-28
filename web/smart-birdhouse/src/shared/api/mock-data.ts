/**
 * Мок-данные для API. Используется при ?videos=mock, ?pi=mock, ?sensors=mock
 */

import type { PiStatus } from './pi';
import type { SensorsData } from './sensors';

export const MOCK_PI_STATUS: PiStatus = {
  pi_power: true,
  state: 1,
  manual: true,
};

export const MOCK_SENSORS: SensorsData = {
  temperature: 22.5,
  humidity: 65,
  battery: 4.15,
  battery_available: true,
  distance_mm: 120,
};
