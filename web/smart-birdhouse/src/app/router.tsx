import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainPage } from '@/pages/main';
import { ROUTES } from '@/shared/constants/routes';

const router = createBrowserRouter([{ path: ROUTES.MAIN, element: <MainPage /> }]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
