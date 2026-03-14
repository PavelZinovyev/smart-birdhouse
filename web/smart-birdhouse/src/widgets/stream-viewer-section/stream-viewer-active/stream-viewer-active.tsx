import { StreamViewerStream } from '../stream-viewer-stream';
import { StreamViewerLoaderOverlay } from '../stream-viewer-loader-overlay';
import { StreamViewerStopOverlay } from '../stream-viewer-stop-overlay';

interface StreamViewerActiveProps {
  streamUrl: string;
  isStreamLoaded: boolean;
  stopOverlayVisible: boolean;
  onLoaded: () => void;
  onError: () => void;
  onStop: () => void;
}

export const StreamViewerActive = ({
  streamUrl,
  isStreamLoaded,
  stopOverlayVisible,
  onLoaded,
  onError,
  onStop,
}: StreamViewerActiveProps) => (
  <>
    <StreamViewerStream streamUrl={streamUrl} onLoaded={onLoaded} onError={onError} />
    {!isStreamLoaded && <StreamViewerLoaderOverlay />}
    {isStreamLoaded && (
      <StreamViewerStopOverlay visible={stopOverlayVisible} onStop={onStop} />
    )}
  </>
);
