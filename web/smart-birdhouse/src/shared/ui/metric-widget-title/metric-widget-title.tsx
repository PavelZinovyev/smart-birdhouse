import styles from './metric-widget-title.module.scss';

interface MetricWidgetTitleProps {
  label: string;
}

export const MetricWidgetTitle = ({ label }: MetricWidgetTitleProps) => {
  return (
    <h3 id={label} className={styles.root}>
      {label}
    </h3>
  );
};
