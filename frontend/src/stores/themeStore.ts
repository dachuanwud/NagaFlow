import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: true, // 默认暗色主题
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
    }),
    {
      name: 'nagaflow-theme',
    }
  )
);
