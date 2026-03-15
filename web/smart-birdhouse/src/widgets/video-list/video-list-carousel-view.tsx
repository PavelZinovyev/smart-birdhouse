import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import type { IPiVideoFile } from '@/shared/api';
import { Container } from '@/shared/ui/container/container';
import { VideoModal } from './video-modal';
import styles from './video-list.module.scss';

type VideoListCarouselViewProps = {
  title: ReactNode;
  content: ReactNode;
  selectedVideo: IPiVideoFile | null;
  onCloseModal: () => void;
  ariaLabel: string;
};

export const VideoListCarouselView = ({
  title,
  content,
  selectedVideo,
  onCloseModal,
  ariaLabel,
}: VideoListCarouselViewProps) => (
  <>
    <Link to={ROUTES.VIDEOS} className={styles.link}>
      <Container aria-label={ariaLabel}>
        {title}
        <article aria-label={ariaLabel}>{content}</article>
      </Container>
    </Link>
    <VideoModal file={selectedVideo} onClose={onCloseModal} />
  </>
);
