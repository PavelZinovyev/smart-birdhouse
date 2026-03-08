import { useEffect, useState } from 'react';
import { getVideosApiLog, subscribeVideosApiLog } from '@/shared/api/videos-api-log';
import styles from './videos-api-log.module.scss';
import { LogBlock } from '../log-block/log-block';

export const VideosApiLog = () => {
  const [log, setLog] = useState(getVideosApiLog);

  useEffect(() => {
    return subscribeVideosApiLog(() => setLog(getVideosApiLog()));
  }, []);

  return (
    <section className={styles.root} aria-label="лог api /videos">
      <h3 className={styles.title}>логи ручки /videos</h3>
      <LogBlock label="GET /videos" entry={log.get} />
      <LogBlock label="DELETE /videos/:name" entry={log.delete} />
    </section>
  );
};
