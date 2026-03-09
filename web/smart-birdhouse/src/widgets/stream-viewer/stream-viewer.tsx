import { useStreamViewer } from './hooks/use-stream-viewer';
import { MetricWidgetTitle, StatusTag } from '@/shared/ui';
import { StreamViewerOffline } from './stream-viewer-offline';
import { StreamViewerPlaceholder } from './stream-viewer-placeholder';
import { StreamViewerStatusDot } from './stream-viewer-status-dot';
import { StreamViewerActive } from './stream-viewer-active';
import { StreamViewerUnavailable } from './stream-viewer-unavailable';
import { StreamViewerErrorOverlay } from './stream-viewer-error-overlay';
import styles from './stream-viewer.module.scss';

export const StreamViewer = () => {
  const {
    showOffline,
    streamUrl,
    isRecording,
    dotStatus,
    statusText,
    isStreamActive,
    isStreamLoaded,
    streamError,
    stopOverlayVisible,
    handleClickStart,
    handleLoaded,
    handleStreamError,
    handleStop,
  } = useStreamViewer();

  const showPlaceholder = !isStreamActive && !isRecording;
  const showUnavailable = !isStreamActive && isRecording;
  const showStreamContent = isStreamActive && !streamError;
  const showStreamError = isStreamActive && streamError;

  if (showOffline) {
    return <StreamViewerOffline />;
  }

  return (
    <article className={styles.root} aria-label="прямой эфир с камеры">
      <MetricWidgetTitle label="Прямой эфир">
        <StreamViewerStatusDot status={dotStatus} />
      </MetricWidgetTitle>
      <div className={styles.content}>
        <div className={styles.wrapper}>
          {showPlaceholder && <StreamViewerPlaceholder onStart={handleClickStart} />}
          {showUnavailable && <StreamViewerUnavailable />}
          {showStreamContent && (
            <StreamViewerActive
              streamUrl={streamUrl}
              isStreamLoaded={isStreamLoaded}
              stopOverlayVisible={stopOverlayVisible}
              onLoaded={handleLoaded}
              onError={handleStreamError}
              onStop={handleStop}
            />
          )}
          {showStreamError && <StreamViewerErrorOverlay onClose={handleStop} />}
        </div>
        {statusText && (
          <div className={styles.statusLine} aria-live="polite">
            <StatusTag variant="gray">{statusText}</StatusTag>
          </div>
        )}
      </div>
    </article>
  );
};
