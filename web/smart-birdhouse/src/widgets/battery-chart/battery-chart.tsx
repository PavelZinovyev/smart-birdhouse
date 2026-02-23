import { MetricWidetTitle } from '@/shared/ui';
import { BatteryIcon } from '../battery-icon/battery-icon';
import styles from './battery-chart.module.scss';

interface BatteryChartProps {
  value: number;
  loading?: boolean;
  /** false = датчик не подключён (питание только 3.3V, без делителя на ADC) */
  batteryAvailable?: boolean;
  className?: string;
}

export const BatteryChart = ({
  value,
  loading = false,
  batteryAvailable = true,
  className,
}: BatteryChartProps) => {
  const showPlaceholder = loading || !batteryAvailable;
  const displayValue = showPlaceholder ? '—' : value;

  return (
    <article className={className} aria-label={'Заряд батареи'}>
      <MetricWidetTitle label="Батарея" />
      <div className={styles.root}>
        <div className={styles.row}>
          <p className={styles.value}>
            <span className={styles.number}>{displayValue}</span>
            <span className={styles.unit}>%</span>
          </p>
          <BatteryIcon percent={batteryAvailable ? value : 0} />
        </div>
        {!batteryAvailable && !loading && (
          <p className={styles.hint}>Нет датчика (добавьте делитель с BAT+ на ADC-пин)</p>
        )}
      </div>
    </article>
  );
};
