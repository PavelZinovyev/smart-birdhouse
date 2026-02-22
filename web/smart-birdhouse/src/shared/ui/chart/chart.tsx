import classNames from 'classnames';
import styles from './chart.module.scss';

interface ChartProps {
  className?: string;
}

export const Chart = ({ className }: ChartProps) => {
  return <div className={classNames(styles.root, className)}>Chart</div>;
};
