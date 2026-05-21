'use client';

import { create } from 'zustand';

interface AuthUser {
  id: string;
  email?: string;
  full_name: string;
  role: string;
  user_type: 'promark' | 'client';
  tenant_id?: string;
  tenant_slug?: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isLoading: false }),
}));
