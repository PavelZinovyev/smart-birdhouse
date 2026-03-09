import { useState, useCallback, useEffect } from 'react';
import { getStreamUrl } from '@/shared/constants/pi';
import { usePiStatusContext, usePiCameraStatus } from '@/shared/api';
import {
  getStreamViewState,
  streamViewStateToDotStatus,
  STREAM_VIEW_STATUS_LABELS,
} from './lib/stream-viewer-state';
import type { StreamViewStateValue } from './lib/stream-viewer-state';
import type { StreamStatus } from './stream-viewer-status-dot';

const STOP_OVERLAY_VISIBLE_MS = 3000;

export interface UseStreamViewerResult {
  showOffline: boolean;
  streamUrl: string;
  isRecording: boolean;
  viewState: StreamViewStateValue;
  dotStatus: StreamStatus;
  statusText: string;
  isStreamActive: boolean;
  isStreamLoaded: boolean;
  streamError: boolean;
  stopOverlayVisible: boolean;
  handleClickStart: () => void;
  handleLoaded: () => void;
  handleStreamError: () => void;
  handleStop: () => void;
}

export function useStreamViewer(): UseStreamViewerResult {
  const [isStreamActive, setStreamActive] = useState(false);
  const [isStreamLoaded, setStreamLoaded] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [stopOverlayVisible, setStopOverlayVisible] = useState(true);

  useEffect(() => {
    if (!isStreamActive || !isStreamLoaded || streamError) return;
    const t = setTimeout(() => setStopOverlayVisible(false), STOP_OVERLAY_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [isStreamActive, isStreamLoaded, streamError]);

  const piStatus = usePiStatusContext();
  const isPiOn = piStatus.data?.pi_power ?? false;
  const { data: cameraStatus } = usePiCameraStatus(isPiOn);
  const isRecording = cameraStatus?.recording ?? false;

  const streamUrl = getStreamUrl();
  const viewState = getStreamViewState(isStreamActive, isStreamLoaded, streamError, isRecording);
  const dotStatus = streamViewStateToDotStatus(viewState);
  const statusText = STREAM_VIEW_STATUS_LABELS[viewState] ?? '';

  const handleClickStart = useCallback(() => {
    if (!isRecording) {
      setStreamActive(true);
      setStreamLoaded(false);
      setStreamError(false);
      setStopOverlayVisible(true);
    }
  }, [isRecording]);

  const handleLoaded = useCallback(() => setStreamLoaded(true), []);

  const handleStreamError = useCallback(() => setStreamError(true), []);

  const handleStop = useCallback(() => {
    setStreamActive(false);
    setStreamLoaded(false);
    setStreamError(false);
  }, []);

  const showOffline = !isPiOn && !piStatus.isLoading;

  return {
    showOffline,
    streamUrl,
    isRecording,
    viewState,
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
  };
}
