'use client';

import { useSyncExternalStore } from 'react';

function assinarMontagemCliente(onStoreChange: () => void) {
  const timeoutId = window.setTimeout(onStoreChange, 0);
  return () => window.clearTimeout(timeoutId);
}

function lerSnapshotClienteMontado() {
  return true;
}

function lerSnapshotServidorMontado() {
  return false;
}

export function useClienteMontado() {
  return useSyncExternalStore(
    assinarMontagemCliente,
    lerSnapshotClienteMontado,
    lerSnapshotServidorMontado
  );
}
