import { getAccessToken } from '../auth/keycloak';
import { NetworkError, RejectedError } from '../offline/outbox';

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
  delete: <T = void>(path: string) => apiRequest<T>('DELETE', path),
};

/** Downloads a file served by the API (the access token cannot travel in a plain link). */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${await getAccessToken()}` },
  });
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** HTTP statuses that mean "try again later" rather than "this entry is wrong". */
const RETRYABLE_STATUSES = new Set([401, 408, 425, 429]);

/**
 * Sends a POST that may have to wait in the outbox. A request that cannot reach the server (network down, server
 * error, expired session) throws a NetworkError: it will be retried. A refusal (invalid entry) throws a RejectedError.
 */
export async function apiSend(path: string, body: unknown): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await getAccessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new NetworkError((error as Error).message);
  }
  if (response.ok) {
    return;
  }
  if (response.status >= 500 || RETRYABLE_STATUSES.has(response.status)) {
    throw new NetworkError(`Le serveur n'a pas pu traiter la demande (${response.status})`);
  }
  throw new RejectedError(await readErrorMessage(response));
}
