import type { StatusTagVariant } from '../status-tag/status-tag';
import { StatusTag } from '../status-tag/status-tag';
import styles from './section-content.module.scss';

export type SectionState = {
  label: string;
  variant?: StatusTagVariant;
};

type SectionContentProps = {
  children: React.ReactNode;
  state?: SectionState;
};

export const SectionContent = ({ children, state }: SectionContentProps) => (
  <div className={styles.root}>
    {state && (
      <div className={styles.stateBadge} role="status">
        <StatusTag variant={state.variant ?? 'red'}>{state.label}</StatusTag>
      </div>
    )}
    <div className={styles.content}>{children}</div>
  </div>
);
