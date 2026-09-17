/**
 * @file    api.js
 * @module  Services
 * @desc    Central API configuration for the Care4U web application.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL;

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error('VITE_API_URL is required for production builds');
}

export const API_BASE_URL = (
  configuredApiUrl || 'http://localhost:5000'
).replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
