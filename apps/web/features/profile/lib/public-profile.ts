import "server-only";
import { presenceApiBaseUrl } from "@/lib/presence-api";
import { PUBLIC_HANDLE_PATTERN } from "@nowly/shared";
import { cache } from "react";

const REVALIDATE_SECONDS = 60;

export type PublicProfile = {
  handle: string;
  name: string;
  image: string | null;
  bio: string | null;
  created: Array<{
    slug: string;
    name: string;
  }> | null;
  liked: Array<{
    slug: string;
    name: string;
  }> | null;
};

export const getPublicProfile = cache(async (handle: string): Promise<PublicProfile | null> => {
  if (!PUBLIC_HANDLE_PATTERN.test(handle)) return null;

  try {
    const response = await fetch(`${presenceApiBaseUrl()}/users/${encodeURIComponent(handle)}`, {
      next: { revalidate: REVALIDATE_SECONDS }
    });

    if (!response.ok) return null;

    return (await response.json()) as PublicProfile;
  } catch {
    return null;
  }
});