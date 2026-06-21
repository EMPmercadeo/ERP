import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobile: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      setMobileOpen: (open) => set({ isMobileOpen: open }),
    }),
    {
      name: 'erp-sidebar-storage',
    }
  )
);

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'vendedor' | 'contador';
}

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>()((set) => ({
  user: {
    id: '1',
    name: 'Usuario Demo',
    email: 'demo@erp-panama.com',
    role: 'admin',
  },
  setUser: (user) => set({ user }),
}));

// Global loading/error state for app-wide feedback
interface AppState {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  isLoading: false,
  error: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
