import styles from './widget-label.module.scss';

interface WidgetLabelProps {
  label: string;
}

export const WidgetLabel = ({ label }: WidgetLabelProps) => {
  return <span className={styles.root}>{label}</span>;
};
