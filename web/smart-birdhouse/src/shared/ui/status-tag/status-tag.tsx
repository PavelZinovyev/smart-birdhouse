import classNames from 'classnames';
import styles from './status-tag.module.scss';

export type StatusTagVariant = 'gray' | 'green' | 'yellow' | 'red';

interface StatusTagProps {
  children: string;
  variant?: StatusTagVariant;
  className?: string;
}

export const StatusTag = ({ children, variant = 'gray', className }: StatusTagProps) => (
  <span className={classNames(styles.tag, styles[`tag_${variant}`], className)} role="status">
    {children}
  </span>
);
