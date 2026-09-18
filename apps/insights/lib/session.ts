import { apiBaseUrlFor, resolveApiTarget, type ApiTarget } from "@/lib/api-target";

export type Session = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: string;
  };
} | null;

export const getSession = async (cookieHeader: string | undefined, target?: ApiTarget): Promise<Session> => {
  const resolvedTarget = target ?? resolveApiTarget(undefined);

  try {
    const res = await fetch(`${apiBaseUrlFor(resolvedTarget)}/auth/get-session`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ? data : null;
  } catch {
    return null;
  }
};
