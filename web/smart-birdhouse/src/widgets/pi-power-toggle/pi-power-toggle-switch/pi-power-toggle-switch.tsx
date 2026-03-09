import classNames from 'classnames';
import styles from './pi-power-toggle-switch.module.scss';

interface PiPowerToggleSwitchProps {
  checked: boolean;
  disabled?: boolean;
  'aria-label'?: string;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const PiPowerToggleSwitch = ({
  checked,
  disabled = false,
  'aria-label': ariaLabel = 'Питание',
  onClick,
  onKeyDown,
}: PiPowerToggleSwitchProps) => (
  <span
    className={classNames(styles.switch, disabled && styles.disabled)}
    data-checked={checked}
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    tabIndex={disabled ? -1 : 0}
    onClick={onClick}
    onKeyDown={onKeyDown}
  >
    <span className={styles.thumb} />
  </span>
);
