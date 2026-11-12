/**
 * @file authStore.js
 * @module Store
 * @desc Zustand authentication state for the Care4U mobile application.
 * @author Wasana Karunanayaka (S/21/081)
 */

import { create } from 'zustand';

/**
 * Create volatile UI state; this is not a credential or authorization store.
 * @param {Function} set - Zustand setter.
 * @returns {Object} user and local state actions; cookies remain with the client.
 */
const useAuthStore = create((set) => ({
  user: null, 
  /** @param {Object} user Public API identity. @returns {void} Sets UI state only. */
  setUser: (user) => set({ user }),
  /** @returns {void} Clears UI state; caller must separately request server logout. */
  clearUser: () => set({ user: null }),
}));

export default useAuthStore;
