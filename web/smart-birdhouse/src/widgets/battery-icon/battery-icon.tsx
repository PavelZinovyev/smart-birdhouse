import classNames from 'classnames';
import styles from './battery-icon.module.scss';
import { getBatteryLevel, getBatteryWidth } from './utils';

interface BatteryIconProps {
  percent: number;
  className?: string;
}

export const BatteryIcon = ({ percent, className }: BatteryIconProps) => {
  const level = getBatteryLevel(percent);
  const width = getBatteryWidth(percent);

  return (
    <div
      className={classNames(styles.root, styles[`level_${level}`], className)}
      role="img"
      aria-label={`Заряд батареи ${percent}%`}
    >
      <div className={styles.body}>
        <div className={styles.fill} style={{ width: `${width}%` }} />
      </div>
      <div className={styles.pin} />
    </div>
  );
};
