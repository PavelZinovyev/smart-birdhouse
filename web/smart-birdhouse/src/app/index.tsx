import { AppRouter } from './router';
import { Providers } from './providers';

export const App = () => (
  <Providers>
    <AppRouter />
  </Providers>
);
