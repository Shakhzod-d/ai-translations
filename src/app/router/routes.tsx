import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { DocumentsPage } from '@/pages/documents';
import { HomePage } from '@/pages/home';
import { NotFoundPage } from '@/pages/not-found';
import { ReaderPage } from '@/pages/reader';
import { SettingsPage } from '@/pages/settings';
import { VocabularyPage } from '@/pages/vocabulary';
import { ROUTES } from '@/shared/config';
import { AppLayout } from '../layouts/app-layout';

/** Future routes (/login, /statistics, /flashcards…) are added here as new lazy pages. */
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: ROUTES.home, element: <HomePage /> },
      { path: ROUTES.documents, element: <DocumentsPage /> },
      { path: ROUTES.reader, element: <ReaderPage /> },
      { path: ROUTES.vocabulary, element: <VocabularyPage /> },
      { path: ROUTES.settings, element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
