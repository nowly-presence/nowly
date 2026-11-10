import { apiBaseUrl } from "@/lib/api-base";

export const apiFetch = async (path: string, init: RequestInit = {}): Promise<Response> =>
  fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: init.body ? { "Content-Type": "application/json", ...init.headers } : init.headers
  });

export const ensureOk = async (response: Response): Promise<Response> => {
  if (!response.ok) throw new Error(`HTTP_${response.status}`);

  return response;
};

export { isRecord } from "@nowly/shared";