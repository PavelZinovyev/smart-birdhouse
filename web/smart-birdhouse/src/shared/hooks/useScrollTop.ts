import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * При смене маршрута прокручивает страницу к верху.
 * Вызывать в компоненте внутри Router (например, в Layout).
 */
export const useScrollTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
};
