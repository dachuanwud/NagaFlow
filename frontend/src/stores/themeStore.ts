import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: true, // 默认暗色主题
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
}));
