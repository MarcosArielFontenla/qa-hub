import { useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SyncModal } from '../features/sync/SyncModal';

interface ShellContext {
  openSync: () => void;
}

export function AppLayout() {
  const [syncOpen, setSyncOpen] = useState(false);
  const context: ShellContext = { openSync: () => setSyncOpen(true) };

  return (
    <div className="shell">
      <Sidebar />
      <Outlet context={context} />
      <SyncModal open={syncOpen} onClose={() => setSyncOpen(false)} />
    </div>
  );
}

export function useOpenSync() {
  return useOutletContext<ShellContext>().openSync;
}
