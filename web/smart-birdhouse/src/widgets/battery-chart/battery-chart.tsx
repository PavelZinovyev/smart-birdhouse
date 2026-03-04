import { MetricWidgetTitle } from '@/shared/ui';
import { BatteryIcon } from '../battery-icon/battery-icon';
import styles from './battery-chart.module.scss';

interface BatteryChartProps {
  value: number;
  voltage?: number;
  loading?: boolean;
  /** false = датчик BQ25895 не обнаружен или не подключён */
  batteryAvailable?: boolean;
  className?: string;
}

export const BatteryChart = ({
  value,
  voltage,
  loading = false,
  batteryAvailable = true,
  className,
}: BatteryChartProps) => {
  const showPlaceholder = loading || !batteryAvailable;
  const displayValue = showPlaceholder ? '—' : value;
   const displayVoltage =
    !showPlaceholder && typeof voltage === 'number' ? voltage.toFixed(2) : null;

  return (
    <article className={className} aria-label={'battery-chart'}>
      <MetricWidgetTitle label="Батарея" />
      <div className={styles.root}>
        <div className={styles.row}>
          <p className={styles.value}>
            <span className={styles.number}>{displayValue}</span>
            <span className={styles.unit}>%</span>
          </p>
          <BatteryIcon percent={batteryAvailable ? value : 0} />
        </div>
        {displayVoltage && (
          <p className={styles.hint}>vBat = {displayVoltage} В</p>
        )}
        {!batteryAvailable && !loading && (
          <p className={styles.hint}>Нет датчика (BQ25895 не обнаружен или не подключён)</p>
        )}
      </div>
    </article>
  );
};
