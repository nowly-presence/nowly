import { CampaignsManager } from "@/features/campaigns/campaigns-manager";
import { CampaignAdminLogin } from "@/features/campaigns/admin-login";
import { presenceApiBaseUrl } from "@/lib/presence-api-client";
import { cookies } from "next/headers";

export const metadata = {
  robots: {
    index: false,
    follow: false
  }
};

const CampaignsPage = async () => {
  let isAdmin: boolean;

  try {
    const response = await fetch(`${presenceApiBaseUrl()}/auth/get-session`, {
      headers: { cookie: (await cookies()).toString() },
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });

    const session: unknown = response.ok ? await response.json() : null;
    isAdmin = Boolean(
      session &&
      typeof session === "object" &&
      "user" in session &&
      session.user &&
      typeof session.user === "object" &&
      "role" in session.user &&
      session.user.role === "admin"
    );
  } catch {
    isAdmin = false;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      {isAdmin ? <CampaignsManager /> : <CampaignAdminLogin />}
    </div>
  );
};

export default CampaignsPage;