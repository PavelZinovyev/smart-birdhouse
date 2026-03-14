import type { PiStatus } from './pi';
import type { SensorsData } from './sensors';

export const MOCK_PI_STATUS: PiStatus = {
  pi_power: true,
  state: 1,
  manual: true,
};

export const MOCK_SENSORS: SensorsData = {
  temperature: 24,
  humidity: 65,
  battery: 4.15,
  battery_percent: 85,
  battery_available: true,
  distance_mm: 120,
  battery_voltage: 4.15,
  battery_current: 0,
  battery_charging: false,
  battery_charge_done: true,
  battery_power_present: false,
  battery_charge_state: 3,
};
