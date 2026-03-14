import React from 'react';
import styles from './container.module.scss';

export const Container = ({ children }: { children: React.ReactNode }) => {
  return <div className={styles.root}>{children}</div>;
};
