import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * При смене маршрута прокручивает страницу к верху
 * Вызывать в компоненте внутри router(например, в layout)
 */
export const useScrollTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });

    return () => window.cancelAnimationFrame(id);
  }, [pathname]);
};
