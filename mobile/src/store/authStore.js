
/**
 * @file    authStore.js
 * @module  Authentication
 * @desc    Keeps the logged-in user's details available across mobile screens.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { create } from 'zustand';

/**
 * FEATURE: Remember the logged-in user across mobile screens.
 * LOGIC: Save the user's details in app memory after login and clear them when needed.
 * Clearing this store does not end the backend login session.
 */
const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

export default useAuthStore;
