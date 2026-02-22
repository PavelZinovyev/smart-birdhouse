import styles from './header.module.scss';

export const Header = () => {
  return (
    <header className={styles.root}>
      <div className={styles.container}>
        <div className={styles.content}></div>
      </div>
    </header>
  );
};
