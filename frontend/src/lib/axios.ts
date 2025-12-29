import axios from 'axios';
import { store } from '../store/store';
import { logOut, setCredentials } from '../store/slices/authSlice';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Essential for sending the Refresh Token cookie
});

// Request Interceptor: Attaches current Access Token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles Token Expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried to avoid infinite loops

      try {
        // 1. Attempt to get a new Access Token
        // We use 'axios' directly (not 'api') to avoid using interceptors for this specific call
        const refreshResponse = await axios.post(
          'http://localhost:3000/api/auth/refresh', 
          {}, 
          { withCredentials: true } // Send the cookie
        );

        const newAccessToken = refreshResponse.data.accessToken;
        const user = store.getState().auth.user; // Keep existing user data

        // 2. Update Redux Store
        if (user) {
            store.dispatch(setCredentials({ user, accessToken: newAccessToken}) );
        }

        // 3. Update the original failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // 4. Retry the original request
        return api(originalRequest);

      } catch (refreshError) {
        // 5. If Refresh fails (Token expired/invalid), force Logout
        store.dispatch(logOut());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;