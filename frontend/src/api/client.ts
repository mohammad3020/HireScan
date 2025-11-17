import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token and handle FormData
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // If data is FormData, remove Content-Type header to let axios set it with boundary
    // Check for FormData by checking constructor name to avoid instanceof issues
    if (config.data && typeof config.data === 'object' && config.data.constructor && config.data.constructor.name === 'FormData') {
      delete config.headers['Content-Type'];
    }
    // Ensure timeout is set
    if (!config.timeout) {
      config.timeout = 30000;
    }
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data || '');
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      const timeoutError = new Error('Request timeout. Please check your connection and try again.');
      (timeoutError as any).userMessage = 'درخواست شما زمان زیادی طول کشید. لطفاً دوباره تلاش کنید.';
      return Promise.reject(timeoutError);
    }

    // Handle network errors
    if (!error.response) {
      const networkError = new Error('Network error. Please check your connection.');
      (networkError as any).userMessage = 'خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
      return Promise.reject(networkError);
    }

    // Handle 401 errors (unauthorized) - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            // Try to refresh the access token
            const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
              refresh: refreshToken,
            }, {
              timeout: 30000,
            });

            const { access } = response.data;
            localStorage.setItem('access_token', access);
            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access}`;

            // Retry the original request with new token
            return apiClient(originalRequest);
          } else {
            // No refresh token, clear auth and redirect to login
            if (typeof window !== 'undefined') {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              // Update auth store
              const { useAuthStore } = await import('../store/auth');
              useAuthStore.getState().logout();
              // Use replace to avoid back button issues
              window.location.replace('/login');
            }
            return Promise.reject(error);
          }
        }
      } catch (refreshError: any) {
        // Refresh failed (token expired or invalid), clear auth and redirect to login
        console.error('Token refresh failed:', refreshError);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Update auth store
          const { useAuthStore } = await import('../store/auth');
          useAuthStore.getState().logout();
          // Use replace to avoid back button issues
          window.location.replace('/login');
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle specific token errors (like "Given token not valid for any token type")
    if (error.response?.data?.detail || error.response?.data?.code) {
      const detail = String(error.response.data.detail || error.response.data.code || '').toLowerCase();
      if (detail.includes('token') || detail.includes('authentication') || detail.includes('not valid')) {
        // Token-related error, clear auth and redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Import and update auth store synchronously
          import('../store/auth').then(({ useAuthStore }) => {
            useAuthStore.getState().logout();
          });
          window.location.replace('/login');
        }
        return Promise.reject(error);
      }
    }

    // Add user-friendly error message
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message || 
                        error.response?.data?.error ||
                        error.message ||
                        'An error occurred';
    (error as any).userMessage = errorMessage;

    return Promise.reject(error);
  }
);

export default apiClient;

