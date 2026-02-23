import { Outlet } from 'react-router-dom';
import { Header, PiPowerToggle } from '@/widgets';

export const Layout = () => {
  return (
    <>
      <Header />
      <main className="layout-main">
        <PiPowerToggle />
        <div className="layout-main-content">
          <Outlet />
        </div>
      </main>
    </>
  );
};
