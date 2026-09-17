/**
 * @file authStore.js
 * @module Store
 * @desc Zustand authentication state for the Care4U web application.
 * @author Wasana Karunanayaka (S/21/081)
 */

import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null, 
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

export default useAuthStore;
