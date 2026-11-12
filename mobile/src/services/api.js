/**
 * @file    api.js
 * @module  Services
 * @desc    Axios base instance for all mobile API calls.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import axios from 'axios';

// Public API origin only. withCredentials requests cookie handling; native
// persistence/restore still needs device verification. No token is stored here.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://localhost:5000' : '');

if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is required for production builds');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
