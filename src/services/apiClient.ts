export class ApiClientError extends Error {
  public readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

export const getApiBaseUrl = () => (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  let body: unknown = undefined;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const message = typeof body === 'object' && body && 'message' in body ? String(body.message) : `Request failed with status ${response.status}.`;
    throw new ApiClientError(message, response.status);
  }
  return body as T;
};

export const apiClient = {
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) throw new ApiClientError('HTTP API is not configured. Using local portal fallback.');
    const response = await fetch(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    return parseResponse<T>(response);
  },
  get: <T>(path: string) => apiClient.request<T>(path),
  post: <T>(path: string, body: unknown) => apiClient.request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => apiClient.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiClient.request<T>(path, { method: 'DELETE' }),
};
