import styles from './header.module.scss';

export const Header = () => {
  return (
    <header className={styles.root}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.title}>Умный скворечник</h2>
        </div>
      </div>
    </header>
  );
};
