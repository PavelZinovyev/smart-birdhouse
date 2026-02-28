import { usePiVideos } from '@/shared/api';
import { Carousel } from '@/shared/ui';
import styles from './video-list.module.scss';
import { VideoCard } from './video-card/video-card';

export const VideoList = () => {
  const { files, loading, error, isSuccess } = usePiVideos(10_000);

  const isEmpty = isSuccess && files.length === 0;
  const hasVideos = isSuccess && files.length > 0;

  return (
    <section className={styles.root} aria-label="Видео с камеры">
      {loading && <p className={styles.empty}>Загрузка…</p>}
      {error && !loading && (
        <p className={styles.error}>
          Нет связи с Raspberry Pi (включите Pi и подключите его к Wi‑Fi скворечника).
        </p>
      )}
      {isEmpty && <p className={styles.empty}>Нет записей</p>}
      {hasVideos && (
        <Carousel orientation="horizontal" extendBy="var(--space-5)" ariaLabel="Видео с камеры">
          {files.map((file) => (
            <div key={file.name} role="listitem">
              <VideoCard file={file} />
            </div>
          ))}
        </Carousel>
      )}
    </section>
  );
};
