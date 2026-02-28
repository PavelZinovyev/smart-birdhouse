import { Outlet } from 'react-router-dom';
import { Header } from '@/widgets';

export const Layout = () => {
  return (
    <>
      <Header />
      <main className="layout-main">
        <div className="layout-main-content">
          <Outlet />
        </div>
      </main>
    </>
  );
};
