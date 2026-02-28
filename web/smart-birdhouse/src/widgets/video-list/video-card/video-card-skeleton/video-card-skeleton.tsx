import classNames from 'classnames';
import styles from './video-card-skeleton.module.scss';

type SkeletonVariant = 'compact' | 'compactSmall';

interface VideoCardSkeletonProps {
  variant?: SkeletonVariant;
}

export const VideoCardSkeleton = ({ variant = 'compact' }: VideoCardSkeletonProps) => {
  return (
    <div
      className={classNames(styles.root, variant === 'compactSmall' && styles.compactSmall)}
      aria-hidden
    >
      <div className={styles.thumb} />
      <div className={styles.info}>
        <div className={styles.line} />
        <div className={styles.lineShort} />
      </div>
    </div>
  );
};
