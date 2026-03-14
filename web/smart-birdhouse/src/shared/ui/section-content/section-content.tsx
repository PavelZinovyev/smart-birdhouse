import styles from './section-content.module.scss';

export const SectionContent = ({ children }: { children: React.ReactNode }) => {
  return <div className={styles.root}>{children}</div>;
};
