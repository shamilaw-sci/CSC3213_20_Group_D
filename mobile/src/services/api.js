
/**
 * @file    api.js
 * @module  Services
 * @desc    Connects the Care4U mobile app to the backend API.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import axios from 'axios';

// FEATURE: Select the backend address for mobile requests.
// LOGIC: Use the configured address. In development, fall back to localhost;
// without an address in production, stop with a clear error.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://localhost:5000' : '');

if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is required for production builds');
}

// FEATURE: Send API requests using the mobile user's session.
// LOGIC: Use one shared API client and request cookie handling for login sessions.
// Cookie storage and restoration on a device depend on the mobile environment.
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
