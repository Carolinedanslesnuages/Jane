import { getAccessToken } from '../auth/keycloak';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Calls the Jane API with the current access token and returns the parsed JSON body. */
export async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    const message = Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
    return message || response.statusText;
  } catch {
    return response.statusText;
  }
}

export const api = {
  get: <T>(path: string) => apiRequest<T>('GET', path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body: unknown) => apiRequest<T>('PATCH', path, body),
  delete: (path: string) => apiRequest<void>('DELETE', path),
};
