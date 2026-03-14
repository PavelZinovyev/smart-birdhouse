import React from 'react';
import styles from './widget-content.module.scss';
import classNames from 'classnames';

export const WidgetContent = ({
  children,
  ariaLabel,
  inactive,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  inactive: boolean;
}) => {
  return (
    <div className={classNames(styles.root, inactive && styles.inactive)} aria-label={ariaLabel}>
      {children}
    </div>
  );
};
