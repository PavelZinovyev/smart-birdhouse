import classNames from 'classnames';
import { WidgetLabel, StatusTag } from '@/shared/ui';
import { PiPowerToggleSwitch } from '../pi-power-toggle-switch';
import { usePiPowerWidget, type PiPowerWidgetPropsBase } from '../hooks/use-pi-power-widget';
import styles from './pi-power-widget.module.scss';

export type PiPowerWidgetProps = PiPowerWidgetPropsBase & { className?: string };

export const PiPowerWidget = ({
  data: status,
  isLoading,
  isError,
  className,
}: PiPowerWidgetProps) => {
  const { on, activityLabel, tagVariant, disabled, handleChange, handleKeyDown } =
    usePiPowerWidget({ data: status, isLoading, isError });

  return (
    <article className={classNames(styles.root, className)} aria-label="Питание">
      <div className={styles.header}>
        <WidgetLabel label="Питание" />
        <PiPowerToggleSwitch
          checked={on}
          disabled={disabled}
          aria-label="Питание"
          onClick={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className={styles.content}>
        <StatusTag variant={tagVariant}>{activityLabel}</StatusTag>
      </div>
    </article>
  );
};
