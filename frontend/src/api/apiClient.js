import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
});

apiClient.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('readtrackUser');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    if (parsed.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`;
    }
  }
  return config;
});

export default apiClient;