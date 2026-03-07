import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/shared/assets/logo.svg?react';
import { ROUTES } from '@/shared/constants/routes';
import styles from './header.module.scss';
import classNames from 'classnames';

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
            <Logo />
            <span className={styles.title}>Птичий домик</span>
          </Link>
        </div>
      </header>
    </div>
  );
};
