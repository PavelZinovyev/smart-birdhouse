import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainPage } from '@/pages/main';
import { ROUTES } from '@/shared/constants/routes';
import { Layout } from './layout';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [{ path: ROUTES.MAIN, element: <MainPage /> }],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
