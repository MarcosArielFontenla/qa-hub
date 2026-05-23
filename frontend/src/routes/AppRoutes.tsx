import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { SettingsPage } from '../features/settings/SettingsPage';
import { TestCasesPage } from '../features/testCases/TestCasesPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/test-cases" replace /> },
      { path: 'test-cases', element: <TestCasesPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/test-cases" replace /> }
    ]
  }
]);
