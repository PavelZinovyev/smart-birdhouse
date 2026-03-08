import styles from './log-block.module.scss';
import type { VideosApiLogEntry } from '@/shared/api/videos-api-log';

export const LogBlock = ({ label, entry }: { label: string; entry: VideosApiLogEntry | null }) => {
  if (!entry) return <div className={styles.root}>{label}: —</div>;

  const ok = entry.status >= 200 && entry.status < 300;
  const content = entry.body || '(пусто)';

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={ok ? styles.statusOk : styles.statusErr}>{entry.status}</span>
        <span className={styles.time}>{entry.time}</span>
      </div>
      <pre className={styles.body}>{content}</pre>
    </div>
  );
};
