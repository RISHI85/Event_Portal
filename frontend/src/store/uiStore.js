import { create } from 'zustand';

const useUiStore = create((set, get) => ({
  loadingCount: 0,
  incrementLoading: () => set({ loadingCount: get().loadingCount + 1 }),
  decrementLoading: () => set((state) => ({ loadingCount: Math.max(0, state.loadingCount - 1) })),
  setLoading: (value) => set({ loadingCount: Math.max(0, Number(value) || 0) }),
}));

export default useUiStore;
