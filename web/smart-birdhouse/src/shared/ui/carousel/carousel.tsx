import { type ReactNode } from 'react';
import classNames from 'classnames';
import styles from './carousel.module.scss';

export interface CarouselProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'grid';
  maxHeight?: string;
  gap?: string | number;
  /** Компенсация паддингов родителя — отрицательные отступы + внутренний padding (напр. var(--space-5)) */
  extendBy?: string;
  className?: string;
  ariaLabel?: string;
}

export const Carousel = ({
  children,
  orientation = 'horizontal',
  maxHeight = '50vh',
  gap = 8,
  extendBy,
  className,
  ariaLabel,
}: CarouselProps) => {
  const extendStyle = extendBy
    ? {
        marginLeft: `calc(-1 * ${extendBy})`,
        marginRight: `calc(-1 * ${extendBy})`,
        paddingLeft: extendBy,
        paddingRight: extendBy,
      }
    : undefined;

  return (
    <div
      className={classNames(styles.root, styles[orientation], className)}
      style={{
        maxHeight,
        gap: typeof gap === 'number' ? `${gap}px` : gap,
        ...extendStyle,
      }}
      role="list"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
};
