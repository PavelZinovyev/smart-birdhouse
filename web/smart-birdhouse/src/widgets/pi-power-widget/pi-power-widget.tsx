import { WidgetLabel, StatusTag } from '@/shared/ui';
import { ToggleSwitch } from '../../shared/ui/toggle-switch';
import {
  usePiPowerWidget,
  type PiPowerWidgetPropsBase,
} from '../pi-power-widget/hooks/use-pi-power-widget';
import styles from './pi-power-widget.module.scss';
import { WidgetContent } from '@/shared/ui/widget-content/widget-content';

export type PiPowerWidgetProps = PiPowerWidgetPropsBase & {
  className?: string;
  forceDisabled?: boolean;
  onShutdownRequest?: () => void;
};

export const PiPowerWidget = ({
  data: status,
  isLoading,
  isError,
  forceDisabled = false,
  onShutdownRequest,
}: PiPowerWidgetProps) => {
  const { on, activityLabel, tagVariant, disabled, handleChange, handleKeyDown } = usePiPowerWidget(
    { data: status, isLoading, isError, onShutdownRequest },
  );
  const isDisabled = disabled || forceDisabled;

  return (
    <WidgetContent ariaLabel="Питание" inactive={isDisabled}>
      <div className={styles.header}>
        <WidgetLabel label="Питание" />
        <ToggleSwitch
          checked={on}
          disabled={isDisabled}
          aria-label="Питание"
          onClick={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className={styles.content}>
        <StatusTag variant={tagVariant}>{activityLabel}</StatusTag>
      </div>
    </WidgetContent>
  );
};
