import { Outlet } from 'react-router-dom';
import { useScrollTop } from '@/shared/hooks';
import { PiStatusProvider } from '@/shared/api/pi-status-provider';
import { Header, PageHeader } from '@/widgets';

export const Layout = () => {
  useScrollTop();

  return (
    <PiStatusProvider>
      <Header />
      <main className="layout-main">
        <div className="layout-main-content">
          <PageHeader />
          <Outlet />
        </div>
      </main>
    </PiStatusProvider>
  );
};
