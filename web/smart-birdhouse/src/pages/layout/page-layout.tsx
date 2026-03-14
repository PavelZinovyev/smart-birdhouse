import { type ReactNode } from 'react';
import classNames from 'classnames';
import styles from './page-layout.module.scss';

type PageLayoutProps = {
  children: ReactNode;
  className?: string;
  stackSize?: 'default' | 'sm' | 'lg';
};

export const PageLayout = ({ children, className, stackSize = 'default' }: PageLayoutProps) => (
  <div className={classNames(styles.root, styles[`stack_${stackSize}`], className)}>{children}</div>
);
