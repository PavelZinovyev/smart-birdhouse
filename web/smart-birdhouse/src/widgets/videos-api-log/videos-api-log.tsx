import { useEffect, useState } from 'react';
import {
  getVideosApiLog,
  subscribeVideosApiLog,
  type VideosApiLogEntry,
} from '@/shared/api/videos-api-log';
import styles from './videos-api-log.module.scss';

function LogBlock({ label, entry }: { label: string; entry: VideosApiLogEntry | null }) {
  if (!entry) return <div className={styles.block}>{label}: —</div>;
  const ok = entry.status >= 200 && entry.status < 300;
  return (
    <div className={styles.block}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={ok ? styles.statusOk : styles.statusErr}>{entry.status}</span>
        <span className={styles.time}>{entry.time}</span>
      </div>
      <pre className={styles.body}>{entry.body || '(пусто)'}</pre>
    </div>
  );
}

export const VideosApiLog = () => {
  const [log, setLog] = useState(getVideosApiLog);

  useEffect(() => {
    return subscribeVideosApiLog(() => setLog(getVideosApiLog()));
  }, []);

  return (
    <section className={styles.root} aria-label="Лог API /videos">
      <h3 className={styles.title}>Лог ручки /videos</h3>
      <LogBlock label="GET /videos" entry={log.get} />
      <LogBlock label="DELETE /videos/:name" entry={log.delete} />
    </section>
  );
};
