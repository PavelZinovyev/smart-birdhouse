import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import BackArrowIcon from '@/shared/assets/back-arrow.svg?react';
import styles from './back-button.module.scss';

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
}

export const BackButton = ({ to = ROUTES.MAIN, onClick }: BackButtonProps) => {
  const className = styles.button;

  if (onClick !== undefined) {
    return (
      <button type="button" className={className} onClick={onClick} aria-label="Назад">
        <BackArrowIcon />
      </button>
    );
  }

  return (
    <Link to={to} className={className} aria-label="Назад">
      <BackArrowIcon />
    </Link>
  );
};
