import { MetricWidgetTitle } from '@/shared/ui';
import { PiRecordingDot } from '../pi-recording-dot';

interface PiPowerToggleTitleProps {
  label: string;
  recording?: boolean;
}

export const PiPowerToggleTitle = ({ label, recording }: PiPowerToggleTitleProps) => (
  <MetricWidgetTitle label={label}>
    {typeof recording === 'boolean' && <PiRecordingDot recording={recording} />}
  </MetricWidgetTitle>
);
