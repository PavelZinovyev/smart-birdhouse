import { Outlet } from 'react-router-dom';
import { Header, PageHeader } from '@/widgets';

export const Layout = () => {
  return (
    <>
      <Header />
      <main className="layout-main">
        <div className="layout-main-content">
          <PageHeader />
          <Outlet />
        </div>
      </main>
    </>
  );
};
