import { auth } from '@/config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * API client with automatic Firebase Auth token injection.
 *
 * Every request automatically attaches the current user's Firebase ID token
 * as a Bearer token in the Authorization header, so the Express backend
 * can verify identity via firebase-admin.
 */

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get the current Firebase ID token, or null if not signed in.
   */
  private async getToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }

  /**
   * Build headers with auth token and content type.
   */
  private async buildHeaders(isFormData = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    const token = await this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  /**
   * Generic request handler with error extraction.
   */
  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { body, ...restOptions } = options;
    const isFormData = body instanceof FormData;

    const headers = await this.buildHeaders(isFormData);

    const config: RequestInit = {
      ...restOptions,
      headers: {
        ...headers,
        ...(restOptions.headers as Record<string, string> || {}),
      },
    };

    if (body !== undefined) {
      config.body = isFormData ? (body as FormData) : JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `Request failed with status ${response.status}`);
      (error as Error & { statusCode?: number; code?: string }).statusCode = response.status;
      (error as Error & { code?: string }).code = `HTTP_${response.status}`;
      throw error;
    }

    return response.json();
  }

  // ─── Convenience Methods ────────────────────────────────────────

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload a file using FormData.
   */
  async uploadFile(endpoint: string, file: File, fieldName = 'file'): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append(fieldName, file);

    return this.request<{ url: string }>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }
}

// Singleton instance
const api = new ApiClient(API_BASE_URL);
export default api;
