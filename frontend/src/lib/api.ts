// src/lib/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetcher<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}`;
    
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.non_field_errors) {
        errorMessage = errorData.non_field_errors.join(', ');
      } else if (typeof errorData === 'object') {
        // Handle field-specific errors
        const fieldErrors = Object.entries(errorData)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('; ');
        errorMessage = fieldErrors || errorMessage;
      }
    } catch {
      // If response is not JSON, try to get text
      try {
        const errorText = await res.text();
        errorMessage = errorText || errorMessage;
      } catch {
        // Use default error message
      }
    }
    
    throw new Error(`API error ${res.status}: ${errorMessage}`);
  }

  // Handle empty responses
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  
  return res.text() as T;
}