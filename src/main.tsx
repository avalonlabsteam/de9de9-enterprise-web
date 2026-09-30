import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/queryClient';
import { initCrossTabSync } from '@/lib/crossTabSync';
import { initDomSync } from '@/lib/domSync';
import { setAppNavigate } from '@/lib/navigation';
import { initAlertes } from '@/features/alertes/hub';
import { router } from '@/routes';
import './index.css';

initDomSync();
initCrossTabSync();
initAlertes();
// Toasts and live events navigate from outside the router's tree.
setAppNavigate((to) => void router.navigate(to));

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* The one toaster: every route, public or signed in, toasts through it. */}
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  </StrictMode>,
);
