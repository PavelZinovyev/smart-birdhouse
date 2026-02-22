import classNames from 'classnames';
import styles from './metric-widget.module.scss';

export type MetricVariant = 'temperature' | 'humidity';

interface MetricWidgetProps {
  label: string;
  value: string | number;
  unit: string;
  variant: MetricVariant;
  className?: string;
}

export const MetricWidget = ({ label, value, unit, variant, className }: MetricWidgetProps) => {
  return (
    <article
      className={classNames(styles.root, styles[variant], className)}
      aria-label={`${label}: ${value} ${unit}`}
    >
      <span className={styles.label}>{label}</span>
      <p className={styles.value}>
        <span className={styles.number}>{value}</span>
        <span className={styles.unit}>{unit}</span>
      </p>
    </article>
  );
};
