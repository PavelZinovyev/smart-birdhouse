import { usePiStatus, usePiPower } from '@/shared/api';
import classNames from 'classnames';
import styles from './pi-power-toggle.module.scss';
import { WidgetLabel } from '@/shared/ui/';

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
    <section className={styles.root} aria-label="Питание Raspberry Pi">
      <div className={styles.container}>
        <div className={styles.left}>
          <WidgetLabel label={'raspberry pi'} />
        </div>
        <span
          className={classNames(styles.switch, disabled && styles.disabled)}
          data-checked={on}
          role="switch"
          aria-checked={on}
          aria-label={'Питание'}
          tabIndex={0}
          onClick={handleChange}
          onKeyDown={handleKeyDown}
        >
          <span className={styles.thumb} />
        </span>
      </div>
    </section>
  );
};
