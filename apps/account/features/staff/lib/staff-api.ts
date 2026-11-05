import { apiBaseUrl } from "@/lib/api-base";
import type { AdminUser } from "@/features/account/lib/account-api";
import type { UserRole } from "@nowly/shared/roles";
import type { Announcement, AnnouncementInput, AnnouncementLocale } from "@nowly/shared/announcements";

export type AuditEvent = {
  id: string;
  actorId: string | null;
  actorKind: string;
  actorName: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  details: unknown;
  createdAt: string;
};

export type StaffPresence = {
  slug: string;
  name: string;
};

export type RepositoryRemoval = "removed" | "missing" | "failed" | "disabled";

const request = async (path: string, init: RequestInit = {}): Promise<Response> =>
  fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: init.body ? { "Content-Type": "application/json", ...init.headers } : init.headers
  });

const ensureOk = async (response: Response): Promise<Response> => {
  if (!response.ok) throw new Error(`HTTP_${response.status}`);

  return response;
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const fetchStaffUsers = async (): Promise<AdminUser[]> => {
  const body = (await (await ensureOk(await request("/admin/users/staff"))).json()) as {
    users: AdminUser[];
  };
  return body.users;
};

export const setAdminUserRole = async (userId: string, role: UserRole): Promise<void> => {
  await ensureOk(
    await request(`/admin/users/${encodeURIComponent(userId)}/role`, {
      method: "PUT",
      body: JSON.stringify({ role })
    })
  );
};

export const fetchAuditEvents = async (before?: string): Promise<AuditEvent[]> => {
  const query = before ? `?before=${encodeURIComponent(before)}` : "";
  const body = (await (await ensureOk(await request(`/admin/audit${query}`))).json()) as {
    events: AuditEvent[];
  };
  return body.events;
};

export const fetchPublicPresences = async (): Promise<StaffPresence[]> => {
  const body: unknown = await (await ensureOk(await request("/presences"))).json();

  const list = Array.isArray(body) ? body : [];

  return list.flatMap((entry): StaffPresence[] => {
    if (!isRecord(entry) || typeof entry.slug !== "string") return [];

    const metadata = isRecord(entry.metadata) ? entry.metadata : null;
    const name = typeof entry.name === "string" ? entry.name : metadata && typeof metadata.name === "string" ? metadata.name : entry.slug;
    return [
      {
        slug: entry.slug,
        name
      }
    ];
  });
};

export const fetchHiddenPresences = async (): Promise<StaffPresence[]> => {
  const body = (await (await ensureOk(await request("/admin/presences/hidden"))).json()) as {
    presences: StaffPresence[];
  };
  return body.presences;
};

export const setPresenceHidden = async (slug: string, hidden: boolean): Promise<void> => {
  await ensureOk(
    await request(`/admin/presences/${encodeURIComponent(slug)}/hidden`, {
      method: "PUT",
      body: JSON.stringify({ hidden })
    })
  );
};

export const deletePresence = async (slug: string): Promise<RepositoryRemoval> => {
  const body = (await (await ensureOk(await request(`/admin/presences/${encodeURIComponent(slug)}`, { method: "DELETE" }))).json()) as {
    repository: RepositoryRemoval;
  };
  return body.repository;
};

export type AnnouncementTexts = {
  title: string;
  description: string;
  content: string;
};

export type TranslationOutcome = AnnouncementTexts | "unavailable" | "failed";

const HTTP_UNAVAILABLE = 503;

export const fetchManagedAnnouncements = async (): Promise<Announcement[]> => {
  const body = (await (await ensureOk(await request("/announcements/manage"))).json()) as {
    items: Announcement[];
  };
  return body.items;
};

export const createAnnouncement = async (input: AnnouncementInput): Promise<void> => {
  await ensureOk(
    await request("/announcements", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        translate: false
      })
    })
  );
};

export const updateAnnouncement = async (id: string, input: AnnouncementInput): Promise<void> => {
  await ensureOk(
    await request(`/announcements/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input)
    })
  );
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await ensureOk(await request(`/announcements/${encodeURIComponent(id)}`, { method: "DELETE" }));
};

export const translateAnnouncementText = async (locale: AnnouncementLocale, source: AnnouncementTexts): Promise<TranslationOutcome> => {
  const response = await request("/announcements/translate", {
    method: "POST",
    body: JSON.stringify({ locale, ...source })
  });

  if (response.status === HTTP_UNAVAILABLE) return "unavailable";

  if (!response.ok) return "failed";

  const body = (await response.json()) as {
    translation: AnnouncementTexts | null;
  };
  return body.translation ?? "failed";
};