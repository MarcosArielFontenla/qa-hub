import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { TestCasesPage } from '../features/testCases/TestCasesPage';
import { BugsPage } from '../features/bugs/BugsPage';
import { ExecutionsPage } from '../features/executions/ExecutionsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'test-cases', element: <TestCasesPage /> },
      { path: 'bugs', element: <BugsPage /> },
      { path: 'executions', element: <ExecutionsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> }
    ]
  }
]);
