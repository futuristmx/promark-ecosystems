'use client';

import { create } from 'zustand';

interface PermissionState {
  permissions: Record<string, boolean>;
  loaded: boolean;
  loadPermissions: (permissions: Record<string, boolean>) => void;
  can: (module: string, action: string) => boolean;
}

export const usePermissions = create<PermissionState>((set, get) => ({
  permissions: {},
  loaded: false,
  loadPermissions: (permissions) => set({ permissions, loaded: true }),
  can: (module, action) => {
    const key = `${module}:${action}`;
    return get().permissions[key] ?? false;
  },
}));
