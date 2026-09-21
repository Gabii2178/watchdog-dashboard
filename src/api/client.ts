const DEFAULT_API_BASE_URL = "http://localhost:3000/api/v1";

type BackendErrorPayload = {
  code?: string;
  message?: string;
  details?: unknown;
};

type BackendResponse = {
  success?: boolean;
  error?: BackendErrorPayload;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type RequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
  token?: string;
};

const isBackendResponse = (value: unknown): value is BackendResponse =>
  typeof value === "object" && value !== null;

const getErrorPayload = (value: unknown): BackendErrorPayload | undefined => {
  if (!isBackendResponse(value) || !isBackendResponse(value.error)) {
    return undefined;
  }
  return value.error;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status === 204 || !contentType.includes("application/json")) {
    const text = await response.text();
    return text || undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, token, ...requestInit } = options;
  const requestHeaders = new Headers(headers);

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}/${path.replace(/^\/+/, "")}`, {
    ...requestInit,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await parseResponse(response);

  if (!response.ok) {
    const error = getErrorPayload(payload);
    throw new ApiError(
      response.status,
      error?.message ?? `Request failed with status ${response.status}.`,
      error?.code,
      error?.details,
    );
  }

  return payload as T;
}

export async function requestBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const { body, headers, token, ...requestInit } = options;
  const requestHeaders = new Headers(headers);

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}/${path.replace(/^\/+/, "")}`, {
    ...requestInit,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const payload = await response.json() as BackendResponse;
      message = getErrorPayload(payload)?.message ?? message;
    } catch {
      // Preserve the status-based message when the error is not JSON.
    }
    throw new ApiError(response.status, message);
  }

  return response.blob();
}
