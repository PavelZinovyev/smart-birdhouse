import classNames from 'classnames';
import styles from './stream-viewer-placeholder.module.scss';

interface StreamViewerPlaceholderProps {
  onStart: () => void;
  disabled?: boolean;
}

export const StreamViewerPlaceholder = ({
  onStart,
  disabled = false,
}: StreamViewerPlaceholderProps) => (
  <div className={styles.wrapper}>
    <button
      type="button"
      className={classNames(styles.placeholder, disabled && styles.disabled)}
      onClick={onStart}
      disabled={disabled}
      aria-label={'эфир'}
      aria-disabled={disabled}
    >
      <span className={styles.placeholderIcon} aria-hidden />
    </button>
  </div>
);
