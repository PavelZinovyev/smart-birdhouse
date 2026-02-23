import classNames from 'classnames';
import styles from './metric-widget.module.scss';
import { getTemperatureLevel } from '@/widgets/environment-chart/utils/getTemperatureLevel';
export type MetricVariant = 'temperature' | 'humidity';
import { WidgetLabel } from '../widget-label/widget-label';

interface MetricWidgetProps {
  label: string;
  value: string | number;
  unit: string;
  variant: MetricVariant;
  className?: string;
  loading?: boolean;
}

export const MetricWidget = ({
  label,
  value,
  unit,
  variant,
  className,
  loading = false,
}: MetricWidgetProps) => {
  const level = variant === 'temperature' ? getTemperatureLevel(Number(value)) : null;
  const displayValue = loading ? '—' : value;

  return (
    <article
      className={classNames(styles.root, styles[variant], className)}
      aria-label={`${label}: ${value} ${unit}`}
    >
      <WidgetLabel label={label} />
      <p className={styles.value}>
        <span className={classNames(styles.number, level && styles[level])}>{displayValue}</span>
        <span className={styles.unit}>{unit}</span>
      </p>
    </article>
  );
};
