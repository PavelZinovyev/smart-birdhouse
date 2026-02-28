import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainPage } from '@/pages/main';
import { VideosPage } from '@/pages/videos';
import { ROUTES } from '@/shared/constants/routes';
import { Layout } from './layout';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: ROUTES.MAIN, element: <MainPage /> },
      { path: ROUTES.VIDEOS, element: <VideosPage /> },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
