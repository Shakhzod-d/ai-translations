import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers/app-providers';
import { createAppRouter } from './router/routes';

export const App = () => {
  const [router] = useState(createAppRouter);
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};
