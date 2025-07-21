import type { ErrorState } from '../types';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Custom error class for API errors
export class ApiServiceError extends Error {
  public status: number;
  public details?: Record<string, string>;

  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiServiceError';
    this.status = status;
    this.details = details;
  }
}

// Base API service with common functionality
export class BaseApiService {
  protected static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiServiceError(
          response.status,
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.details,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiServiceError) {
        throw error;
      }

      // Network or other errors
      throw new ApiServiceError(0, error instanceof Error ? error.message : 'Network error occurred');
    }
  }

  protected static handleError(error: unknown): ErrorState {
    if (error instanceof ApiServiceError) {
      if (error.status === 0) {
        return {
          type: 'network',
          message: 'Network connection failed. Please check your internet connection.',
          retryable: true,
        };
      }

      if (error.status >= 400 && error.status < 500) {
        return {
          type: 'validation',
          message: error.message,
          retryable: false,
        };
      }

      if (error.status >= 500) {
        return {
          type: 'server',
          message: 'Server error occurred. Please try again later.',
          retryable: true,
        };
      }
    }

    return {
      type: 'unknown',
      message: 'An unexpected error occurred.',
      retryable: true,
    };
  }

  protected static validateResponse<T>(data: any, validator: (data: any) => data is T): T {
    if (!validator(data)) {
      throw new ApiServiceError(422, 'Invalid response format from server');
    }
    return data;
  }
}
