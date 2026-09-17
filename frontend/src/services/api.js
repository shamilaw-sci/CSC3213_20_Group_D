/**
 * @file    api.js
 * @module  Services
 * @desc    Central API configuration for the Care4U web application.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import axios from 'axios';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000'
).replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;