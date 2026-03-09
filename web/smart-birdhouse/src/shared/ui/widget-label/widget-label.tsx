import styles from './widget-label.module.scss';

interface WidgetLabelProps {
  label: string;
  id?: string;
}

export const WidgetLabel = ({ label, id }: WidgetLabelProps) => {
  return (
    <span id={id} className={styles.root}>
      {label}
    </span>
  );
};
