import { ApiError, ErrorResponse } from "@/types/posts";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://k8s.mectest.ru/test-app/";
const API_BEARER_UUID =
  process.env.EXPO_PUBLIC_API_BEARER_UUID ??
  "550e8400-e29b-41d4-a716-446655440000";

const defaultHeaders: HeadersInit = {
  Accept: "application/json",
  Authorization: `Bearer ${API_BEARER_UUID}`,
};

function createUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  const normalizedPath = path.replace(/^\/+/, "");
  const url = new URL(normalizedPath, API_BASE_URL);

  if (!params) {
    return url.toString();
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export async function getJson<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const response = await fetch(createUrl(path, params), {
    method: "GET",
    headers: defaultHeaders,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = (await response.json()) as ErrorResponse;
      if (errorBody?.error?.message) {
        message = errorBody.error.message;
      }
    } catch {
      // Fallback to generic message when body is not JSON.
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}
