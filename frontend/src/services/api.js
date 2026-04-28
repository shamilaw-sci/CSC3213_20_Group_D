/**
 * @file    api.js
 * @module  Services
 * @desc    Axios base instance for all Care4U API calls.
 *          withCredentials must be true for session cookies to be sent.
 * @author  Member 2 (S/21/081)
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,          // sends session cookie on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;