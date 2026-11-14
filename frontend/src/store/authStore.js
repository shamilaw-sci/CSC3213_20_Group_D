
/**
 * @file    authStore.js
 * @module  Authentication
 * @desc    Keeps the logged-in user's details available across web pages.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { create } from 'zustand';

/**
 * FEATURE: Remember the signed-in user while the website is open.
 * LOGIC: Save user details after login and clear them when needed.
 * Clearing this store only updates the screen; server logout is handled separately.
 */
const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

export default useAuthStore;
