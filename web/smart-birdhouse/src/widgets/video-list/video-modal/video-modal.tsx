import { Modal } from '@/shared/ui';
import { getVideoUrl, type PiVideoFile } from '@/shared/api';
import styles from './video-modal.module.scss';

export interface VideoModalProps {
  file: PiVideoFile | null;
  onClose: () => void;
}

export const VideoModal = ({ file, onClose }: VideoModalProps) => {
  if (file === null) return null;

  const videoUrl = getVideoUrl(file.name);

  return (
    <Modal isOpen={true} onClose={onClose} closeLabel="Закрыть видео">
      <div className={styles.wrap}>
        <h2 className={styles.title}>{file.name}</h2>
        <video className={styles.video} src={videoUrl} controls autoPlay playsInline />
      </div>
    </Modal>
  );
};
