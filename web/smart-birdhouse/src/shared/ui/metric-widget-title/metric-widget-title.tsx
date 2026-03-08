import type { ReactNode } from 'react';
import styles from './metric-widget-title.module.scss';

interface MetricWidgetTitleProps {
  label: string;
  children?: ReactNode;
}

export const MetricWidgetTitle = ({ label, children }: MetricWidgetTitleProps) => {
  return (
    <h3 id={label} className={styles.root}>
      {label}
      {children}
    </h3>
  );
};
