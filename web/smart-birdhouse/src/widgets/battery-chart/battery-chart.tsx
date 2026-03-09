import { MetricWidgetTitle } from '@/shared/ui';
import { BatteryIcon } from '../battery-icon/battery-icon';
import styles from './battery-chart.module.scss';

export interface BatteryChartProps {
  value: number;
  voltage?: number;
  loading?: boolean;
  batteryAvailable?: boolean;
  isCharging?: boolean;
  isChargeDone?: boolean;
  isExternalPowerPresent?: boolean;
  className?: string;
}
export const BatteryChart = ({
  value,
  voltage,
  loading = false,
  batteryAvailable = true,
  isCharging,
  className,
}: BatteryChartProps) => {
  const showPlaceholder = loading || !batteryAvailable;
  const displayValue = showPlaceholder ? '—' : value;
  const displayVoltage =
    !showPlaceholder && typeof voltage === 'number' ? voltage.toFixed(2) : null;
  const showChargeAnimation = !showPlaceholder && isCharging === true;

  return (
    <article className={className} aria-label={'battery-chart'}>
      <MetricWidgetTitle label="Батарея" />
      <div className={styles.root}>
        <div className={styles.row}>
          <p className={styles.value}>
            <span className={styles.number}>{displayValue}</span>
            <span className={styles.unit}>%</span>
          </p>
          <BatteryIcon percent={batteryAvailable ? value : 0} isCharging={showChargeAnimation} />
        </div>
        {displayVoltage && <p className={styles.hint}>Напряжение: {displayVoltage} В</p>}
      </div>
    </article>
  );
};
