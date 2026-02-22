import { MetricWidetTitle } from '@/shared/ui';
import { BatteryIcon } from '../battery-icon/battery-icon';
import styles from './battery-chart.module.scss';

interface BatteryChartProps {
  value: number;
  className?: string;
}

export const BatteryChart = ({ value, className }: BatteryChartProps) => {
  return (
    <article className={className} aria-label={`Заряд батареи: ${value}%`}>
      <MetricWidetTitle label="Батарея" />
      <div className={styles.root}>
        <div className={styles.row}>
          <p className={styles.value}>
            <span className={styles.number}>{value}</span>
            <span className={styles.unit}>%</span>
          </p>
          <BatteryIcon percent={value} />
        </div>
      </div>
    </article>
  );
};
