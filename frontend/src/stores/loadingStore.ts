import { create } from 'zustand';

interface LoadingState {
  // 全局加载状态
  globalLoading: boolean;
  
  // 页面级加载状态
  pageLoading: Record<string, boolean>;
  
  // 组件级加载状态
  componentLoading: Record<string, boolean>;
  
  // 操作级加载状态
  actionLoading: Record<string, boolean>;
  
  // 设置全局加载状态
  setGlobalLoading: (loading: boolean) => void;
  
  // 设置页面加载状态
  setPageLoading: (page: string, loading: boolean) => void;
  
  // 设置组件加载状态
  setComponentLoading: (component: string, loading: boolean) => void;
  
  // 设置操作加载状态
  setActionLoading: (action: string, loading: boolean) => void;
  
  // 检查是否有任何加载状态
  hasAnyLoading: () => boolean;
  
  // 清除所有加载状态
  clearAllLoading: () => void;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  globalLoading: false,
  pageLoading: {},
  componentLoading: {},
  actionLoading: {},
  
  setGlobalLoading: (loading: boolean) => 
    set({ globalLoading: loading }),
  
  setPageLoading: (page: string, loading: boolean) =>
    set((state) => ({
      pageLoading: {
        ...state.pageLoading,
        [page]: loading,
      },
    })),
  
  setComponentLoading: (component: string, loading: boolean) =>
    set((state) => ({
      componentLoading: {
        ...state.componentLoading,
        [component]: loading,
      },
    })),
  
  setActionLoading: (action: string, loading: boolean) =>
    set((state) => ({
      actionLoading: {
        ...state.actionLoading,
        [action]: loading,
      },
    })),
  
  hasAnyLoading: () => {
    const state = get();
    return (
      state.globalLoading ||
      Object.values(state.pageLoading).some(Boolean) ||
      Object.values(state.componentLoading).some(Boolean) ||
      Object.values(state.actionLoading).some(Boolean)
    );
  },
  
  clearAllLoading: () =>
    set({
      globalLoading: false,
      pageLoading: {},
      componentLoading: {},
      actionLoading: {},
    }),
}));
