import classNames from 'classnames';
import styles from './video-card-skeleton.module.scss';

type SkeletonVariant = 'compact' | 'compactSmall' | 'large';

interface VideoCardSkeletonProps {
  variant?: SkeletonVariant;
}

export const VideoCardSkeleton = ({ variant = 'compact' }: VideoCardSkeletonProps) => {
  return (
    <div
      className={classNames(
        styles.root,
        variant === 'compactSmall' && styles.compactSmall,
        variant === 'large' && styles.large,
      )}
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
