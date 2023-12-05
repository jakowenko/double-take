import axios from 'axios';
import Constants from '@/util/constants.util';
import emitter from '@/services/emitter.service';

const baseURL = Constants().api;
const api = axios.create({
  baseURL: baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((request) => {
  const token = localStorage.getItem('token');
  if (token) request.headers.common.authorization = token;
  return request;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.data?.error) error.message = error?.response?.data?.error;
    if (error?.response?.status === 401) emitter.emit('login');
    return Promise.reject(error);
  },
);
export default api;
