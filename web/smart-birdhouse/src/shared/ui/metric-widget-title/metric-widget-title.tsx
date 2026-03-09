import type { ReactNode } from 'react';
import styles from './metric-widget-title.module.scss';

interface MetricWidgetTitleProps {
  label: string;
  id?: string;
  children?: ReactNode;
}

export const MetricWidgetTitle = ({ label, id, children }: MetricWidgetTitleProps) => {
  return (
    <h3 id={id ?? label} className={styles.root}>
      {label}
      {children}
    </h3>
  );
};
