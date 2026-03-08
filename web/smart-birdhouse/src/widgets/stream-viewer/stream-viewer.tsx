import { useState } from 'react';
import { getStreamUrl } from '@/shared/constants/pi';
import { usePiStatusContext } from '@/shared/api';
import { MetricWidgetTitle } from '@/shared/ui';
import { StreamViewerOffline } from './stream-viewer-offline';
import { StreamViewerPlaceholder } from './stream-viewer-placeholder';
import { StreamViewerStream } from './stream-viewer-stream';
import styles from './stream-viewer.module.scss';

export const StreamViewer = () => {
  const [isStreamActive, setStreamActive] = useState(false);

  const piStatus = usePiStatusContext();
  const isPiOn = piStatus.data?.pi_power ?? false;

  if (!isPiOn && !piStatus.isLoading) {
    return <StreamViewerOffline />;
  }

  const streamUrl = getStreamUrl();

  const handleClickStart = () => {
    setStreamActive(true);
  };

  return (
    <article className={styles.root} aria-label="прямой эфир с камеры">
      <MetricWidgetTitle label="Прямой эфир" />
      <div className={styles.content}>
        <div className={styles.wrapper}>
          {isStreamActive && <StreamViewerStream streamUrl={streamUrl} />}
          {!isStreamActive && <StreamViewerPlaceholder onStart={handleClickStart} />}
        </div>
      </div>
    </article>
  );
};
