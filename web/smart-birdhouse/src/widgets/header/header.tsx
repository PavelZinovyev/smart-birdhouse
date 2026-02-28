import { Link } from 'react-router-dom';
import Logo from '@/shared/assets/logo.svg?react';
import { ROUTES } from '@/shared/constants/routes';
import styles from './header.module.scss';

export const Header = () => {
  return (
    <header className={styles.root}>
      <div className={styles.container}>
        <Link to={ROUTES.MAIN} className={styles.link}>
          <Logo />
          <span className={styles.title}>Птичий домик</span>
        </Link>
      </div>
    </header>
  );
};
