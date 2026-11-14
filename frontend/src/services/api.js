
/**
 * @file    api.js
 * @module  Services
 * @desc    Central API configuration for the Care4U web application.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import axios from 'axios';

// FEATURE: Connect the website to the correct backend.
// LOGIC: Use the configured address, or localhost during development.
// In production, require the address to be configured.
const configuredApiUrl = import.meta.env.VITE_API_URL;

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error('VITE_API_URL is required for production builds');
}

export const API_BASE_URL = (
  configuredApiUrl || 'http://localhost:5000'
).replace(/\/$/, '');

// FEATURE: Keep users signed in during API requests.
// LOGIC: Ask the browser to send its session cookie.
// The backend checks the user's permissions before returning protected data.
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
