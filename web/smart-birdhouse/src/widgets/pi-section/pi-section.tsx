import { usePiStatusContext } from '@/shared/api';
import { MetricWidgetTitle } from '@/shared/ui';
import { PiPowerWidget } from '../pi-power-widget';
import { PiCameraWidget } from '../pi-camera-widget';
import styles from './pi-section.module.scss';

const PI_SECTION_TITLE_ID = 'pi-section-title';

export const PiSection = () => {
  const piStatus = usePiStatusContext();

  return (
    <section className={styles.root} aria-labelledby={PI_SECTION_TITLE_ID}>
      <MetricWidgetTitle id={PI_SECTION_TITLE_ID} label="Raspberry Pi" />
      <div className={styles.wrapper} role="group">
        <PiPowerWidget {...piStatus} />
        <PiCameraWidget {...piStatus} />
      </div>
    </section>
  );
};
