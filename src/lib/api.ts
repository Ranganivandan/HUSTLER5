const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface ApiError {
  error: string | object;
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from memory (set after login)
    this.accessToken = null;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Important for cookies (refresh token)
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Request failed',
      }));
      throw new Error(
        typeof error.error === 'string' ? error.error : 'Request failed'
      );
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_URL);

// Auth API
export const authApi = {
  signup: (data: { email: string; password: string; fullName: string }) =>
    apiClient.post<{ user: { id: string; email: string; name: string }; accessToken: string }>(
      '/v1/auth/signup',
      data
    ),
  login: (data: { email: string; password: string }) =>
    apiClient.post<{ user: { id: string; email: string; name: string; role: string }; accessToken: string }>(
      '/v1/auth/login',
      data
    ),
  refresh: () =>
    apiClient.post<{ accessToken: string }>('/v1/auth/refresh'),
  logout: () => apiClient.post<void>('/v1/auth/logout'),
};
