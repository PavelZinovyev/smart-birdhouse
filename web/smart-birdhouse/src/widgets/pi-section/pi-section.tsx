import { useState } from 'react';
import { usePiStatusContext, usePiCameraStatus } from '@/shared/api';
import { MetricWidgetTitle } from '@/shared/ui';
import { PiPowerWidget } from '../pi-power-widget';
import { PiCameraWidget } from '../pi-camera-widget';
import { Container } from '@/shared/ui/container/container';
import { SectionContent } from '@/shared/ui/section-content/section-content';

const PI_SECTION_LABEL = 'Raspberry Pi';
const AUTO_RECORDING_LABEL = 'Замечено движение, идёт авто-запись';

export const PiSection = () => {
  const piStatus = usePiStatusContext();
  const on = piStatus.data?.pi_power ?? false;
  const { data: cameraStatus } = usePiCameraStatus(on);
  const recording = cameraStatus?.recording ?? false;
  const manualMode = cameraStatus?.manual_mode ?? false;
  const autoRecording = on && !manualMode && recording;

  const [shutdownRequested, setShutdownRequested] = useState(false);
  const isShuttingDown = shutdownRequested && on;
  const cameraDisabled = autoRecording || isShuttingDown;

  return (
    <Container aria-labely={PI_SECTION_LABEL}>
      <MetricWidgetTitle id={PI_SECTION_LABEL} label={PI_SECTION_LABEL} />
      <SectionContent
        state={autoRecording ? { label: AUTO_RECORDING_LABEL, variant: 'red' } : undefined}
      >
        <PiPowerWidget
          {...piStatus}
          forceDisabled={autoRecording}
          onShutdownRequest={() => setShutdownRequested(true)}
        />
        <PiCameraWidget
          {...piStatus}
          forceDisabled={cameraDisabled}
          forceUnavailable={isShuttingDown}
        />
      </SectionContent>
    </Container>
  );
};
