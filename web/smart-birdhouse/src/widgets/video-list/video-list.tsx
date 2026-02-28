import { usePiVideos } from '@/shared/api';
import { Carousel } from '@/shared/ui';
import styles from './video-list.module.scss';
import { VideoCard } from './video-card/video-card';
import { MetricWidgetTitle } from '@/shared/ui';

export const VideoList = () => {
  const { files, loading, error, isSuccess } = usePiVideos(10_000);

  const isEmpty = isSuccess && files.length === 0;
  const hasVideos = isSuccess && files.length > 0;

  return (
    <article aria-label="videos">
      <MetricWidgetTitle label="Видео с камеры" />
      <div className={styles.content}>
        {loading && <p className={styles.empty}>Загрузка…</p>}
        {error && !loading && (
          <p className={styles.error}>
            Нет связи с Raspberry Pi (включите Pi и подключите его к Wi‑Fi скворечника).
          </p>
        )}
        {isEmpty && <p className={styles.empty}>Нет записей</p>}
        {hasVideos && (
          <Carousel orientation="horizontal" extendBy="var(--space-5)" ariaLabel="videos carousel">
            {files.map((file) => (
              <div key={file.name} role="listitem">
                <VideoCard file={file} />
              </div>
            ))}
          </Carousel>
        )}
      </div>
    </article>
  );
};
