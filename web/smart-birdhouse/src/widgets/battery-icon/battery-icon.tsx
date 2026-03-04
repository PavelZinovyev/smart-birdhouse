import classNames from 'classnames';
import styles from './battery-icon.module.scss';
import { getBatteryLevel, getBatteryWidth } from './utils';

interface IBatteryIconProps {
  percent: number;
  isCharging: boolean;
  className?: string;
}

export const BatteryIcon = ({ percent, isCharging, className }: IBatteryIconProps) => {
  const level = getBatteryLevel(percent);
  const width = getBatteryWidth(percent);

  return (
    <div
      className={classNames(styles.root, styles[`level_${level}`], className)}
      role="img"
      aria-label={`Заряд батареи ${percent}%`}
    >
      <div className={classNames(styles.body, isCharging && styles.charging)}>
        <div className={styles.fill} style={{ width: `${width}%` }} />
      </div>
      <div className={classNames(styles.pin, isCharging && styles.charging)} />
    </div>
  );
};
