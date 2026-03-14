import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import Logo from '@/shared/assets/logo.svg?react';
import { ROUTES } from '@/shared/constants/routes';
import { BatteryWidget } from '@/widgets';
import styles from './header.module.scss';

const SCROLL_THRESHOLD = 24;

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={classNames(styles.wrapper, scrolled && styles.scrolled)}>
      <header className={styles.root}>
        <div className={styles.container}>
          <Link to={ROUTES.MAIN} className={styles.link}>
            <Logo className={styles.logo} />
            <span className={styles.title}>Птичий домик</span>
          </Link>
          <BatteryWidget />
        </div>
      </header>
    </div>
  );
};
