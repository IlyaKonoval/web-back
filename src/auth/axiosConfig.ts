import axios, {
  AxiosHeaders,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
  AxiosInstance,
} from 'axios';

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      config.headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });
    }
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post<RefreshTokenResponse>(
          `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/auth/refresh-token`,
          {
            refresh_token: refreshToken,
          },
        );

        const { access_token, refresh_token } = response.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        window.location.href = '/auth/login';
        return Promise.reject(new Error('Authentication token refresh failed'));
      }
    }
    return Promise.reject(error);
  },
);

export default api;
