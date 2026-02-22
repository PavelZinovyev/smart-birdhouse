import styles from './metric-widget-title.module.scss';

interface MetricWidetTitleProps {
  label: string;
}

export const MetricWidetTitle = ({ label }: MetricWidetTitleProps) => {
  return (
    <h2 id={label} className={styles.root}>
      {label}
    </h2>
  );
};
