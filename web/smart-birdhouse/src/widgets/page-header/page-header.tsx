import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { BackButton } from '@/shared/ui/back-button/back-button';
import styles from './page-header.module.scss';

const PATH_TITLE: Partial<Record<string, string>> = {
  [ROUTES.VIDEOS]: 'Видео',
};

export const PageHeader = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = PATH_TITLE[pathname];
  const showBack = pathname !== ROUTES.MAIN;

  if (!showBack && !title) {
    return null;
  }

  const handleNavigateBack = () => {
    navigate(-1);
  };

  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        {showBack && <BackButton onClick={handleNavigateBack} />}
        {title && <h1 className={styles.title}>{title}</h1>}
      </div>
    </header>
  );
};
