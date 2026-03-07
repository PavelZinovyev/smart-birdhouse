import { Outlet } from 'react-router-dom';
import { useScrollTop } from '@/shared/hooks';
import { Header, PageHeader } from '@/widgets';

export const Layout = () => {
  useScrollTop();

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
