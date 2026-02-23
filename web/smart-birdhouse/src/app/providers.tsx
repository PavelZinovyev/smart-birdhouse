import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { queryClient } from '@/shared/api/query-client';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
