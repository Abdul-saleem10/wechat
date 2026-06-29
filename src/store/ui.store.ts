import { create } from 'zustand';

interface UIState {
  isMobileSidebarOpen: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  isUploading: boolean;
  uploadProgress: number;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setIsUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileSidebarOpen: false,
  isSearchOpen: false,
  searchQuery: '',
  isUploading: false,
  uploadProgress: 0,
  toggleMobileSidebar: () => set((s) => ({ isMobileSidebarOpen: !s.isMobileSidebarOpen })),
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
}));
