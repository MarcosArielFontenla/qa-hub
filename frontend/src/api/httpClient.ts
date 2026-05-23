import axios from 'axios';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface ApiError {
  code?: string;
  message?: string;
  details?: unknown;
}

// Extracts the backend's standard error envelope ({ error: { code, message, details } }).
// Falls back to the network/axios message, or null for non-axios errors.
export function apiError(err: unknown): ApiError | null {
  if (axios.isAxiosError(err)) {
    const envelope = err.response?.data as { error?: ApiError } | undefined;
    if (envelope?.error) return envelope.error;
    return { message: err.message };
  }
  return null;
}
