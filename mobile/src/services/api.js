/**
 * @file    api.js
 * @module  Services
 * @desc    Axios base instance for all mobile API calls.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://10.235.201.10:5000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default api;