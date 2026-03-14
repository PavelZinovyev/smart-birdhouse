import { usePiStatusContext, usePiCameraStatus } from '@/shared/api';
import { MetricWidgetTitle, StatusTag } from '@/shared/ui';
import { PiPowerWidget } from '../pi-power-widget';
import { PiCameraWidget } from '../pi-camera-widget';
import styles from './pi-section.module.scss';
import { Container } from '@/shared/ui/container/container';

const PI_SECTION_LABEL = 'Raspberry Pi';

const AUTO_RECORDING_LABEL = 'Замечено движение, идёт авто-запись';

export const PiSection = () => {
  const piStatus = usePiStatusContext();
  const on = piStatus.data?.pi_power ?? false;
  const { data: cameraStatus } = usePiCameraStatus(on);
  const recording = cameraStatus?.recording ?? false;
  const manualMode = cameraStatus?.manual_mode ?? false;
  const autoRecording = on && !manualMode && recording;

  return (
    <Container aria-labely={PI_SECTION_LABEL}>
      <MetricWidgetTitle id={PI_SECTION_LABEL} label={PI_SECTION_LABEL} />
      {autoRecording && <StatusTag variant="red">{AUTO_RECORDING_LABEL}</StatusTag>}
      <div className={styles.wrapper} role="group">
        <PiPowerWidget {...piStatus} forceDisabled={autoRecording} />
        <PiCameraWidget {...piStatus} forceDisabled={autoRecording} />
      </div>
    </Container>
  );
};
