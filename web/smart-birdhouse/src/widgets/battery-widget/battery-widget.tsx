import { useSensors } from '@/shared/api';
import { BatteryIcon } from '@/widgets/battery-icon/battery-icon';
import styles from './battery-widget.module.scss';

export interface BatteryWidgetProps {
  className?: string;
  textClassName?: string;
  pollIntervalMs?: number;
}

const DEFAULT_POLL_INTERVAL_MS = 5000;

export const BatteryWidget = () => {
  const { data: sensors, loading: sensorsLoading } = useSensors(DEFAULT_POLL_INTERVAL_MS);

  const batteryAvailable = sensors?.battery_available ?? true;
  const batteryPercent = sensors?.battery_percent ?? 0;
  const isCharging = sensors?.battery_charging ?? false;

  const showPlaceholder = sensorsLoading || !batteryAvailable;
  const displayPercent = showPlaceholder ? '—' : batteryPercent;

  return (
    <div className={styles.root}>
      <BatteryIcon
        percent={batteryAvailable ? batteryPercent : 0}
        isCharging={!showPlaceholder && isCharging}
      />
      <span className={styles.text}>
        {typeof displayPercent === 'number' ? `${displayPercent}%` : displayPercent}
      </span>
    </div>
  );
};
