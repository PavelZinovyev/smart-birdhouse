import { usePiStatus, usePiPower } from '@/shared/api';
import classNames from 'classnames';
import styles from './pi-power-toggle.module.scss';
import { MetricWidgetTitle } from '@/shared/ui';

export const PiPowerToggle = () => {
  const { data: status, isLoading, isError } = usePiStatus(3000);
  const { turnOnManual, turnOff, isPending } = usePiPower();

  const on = status?.pi_power ?? false;
  const busy = isPending || isLoading;
  const disabled = isError || busy;

  const handleChange = () => {
    if (disabled) return;
    if (on) {
      turnOff();
    } else {
      turnOnManual();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleChange();
    }
  };

  return (
    <article className={styles.root} aria-label="raspi power toggle">
      <MetricWidgetTitle label="Raspberry Pi" />
      <div className={styles.content}>
        <span className={styles.status}>{on ? 'Вкл' : 'Выкл'}</span>
        <span
          className={classNames(styles.switch, disabled && styles.disabled)}
          data-checked={on}
          role="switch"
          aria-checked={on}
          aria-label="Питание"
          tabIndex={disabled ? -1 : 0}
          onClick={handleChange}
          onKeyDown={handleKeyDown}
        >
          <span className={styles.thumb} />
        </span>
      </div>
    </article>
  );
};
