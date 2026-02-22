import { Outlet } from 'react-router-dom';
import { Header } from '@/widgets';

export const Layout = () => {
  return (
    <>
      <Header />
      <main className="layout-main">
        <Outlet />
      </main>
    </>
  );
};
