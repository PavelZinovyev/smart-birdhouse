import { MetricWidgetTitle } from '@/shared/ui';
import styles from '../stream-viewer-section.module.scss';

export const StreamViewerOffline = () => (
  <article className={styles.root} aria-label="прямой эфир с камеры">
    <MetricWidgetTitle label="Прямой эфир" />
    <div className={styles.content}>
      <p className={styles.message}>Включите Raspberry Pi для просмотра</p>
    </div>
  </article>
);
