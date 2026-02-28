import { Link } from 'react-router-dom';
import styles from './header.module.scss';
import { ROUTES } from '@/shared/constants/routes';

export const Header = () => {
  return (
    <header className={styles.root}>
      <div className={styles.container}>
        <div className={styles.content}>
          <Link to={ROUTES.MAIN} className={styles.title}>
            Умный скворечник
          </Link>
        </div>
      </div>
    </header>
  );
};
