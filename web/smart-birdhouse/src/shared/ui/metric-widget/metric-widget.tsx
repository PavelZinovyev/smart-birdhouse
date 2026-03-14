import styles from './metric-widget.module.scss';
export type MetricVariant = 'temperature' | 'humidity';
import { WidgetLabel } from '../widget-label/widget-label';
import { WidgetContent } from '../widget-content/widget-content';

interface MetricWidgetProps {
  label: string;
  value: string | number;
  unit: string;
  variant: MetricVariant;
  loading?: boolean;
}

export const MetricWidget = ({ label, value, unit, loading = false }: MetricWidgetProps) => {
  const displayValue = loading ? '—' : value;

  return (
    <WidgetContent ariaLabel={`${label}: ${value} ${unit}`} inactive={false}>
      <WidgetLabel label={label} />
      <p className={styles.value}>
        <span className={styles.number}>{displayValue}</span>
        <span className={styles.unit}>{unit}</span>
      </p>
    </WidgetContent>
  );
};
