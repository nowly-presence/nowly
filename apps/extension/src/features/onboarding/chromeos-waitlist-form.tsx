import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL, CHROMEOS_WAITLIST_CAMPAIGN_ID } from "@/shared/constants";
import { t } from "@/shared/i18n";
import type { FC } from "react";
import { useState } from "react";

export const ChromeOsWaitlistForm: FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  if (!CHROMEOS_WAITLIST_CAMPAIGN_ID) return null;
  if (status === "done") {
    return <p className="mt-3 text-sm leading-5 text-muted-foreground">{t("chromeos-waitlist-success")}</p>;
  }

  const submit = async () => {
    if (!email.trim()) return;
    setStatus("sending");
    try {
      await fetch(`${API_BASE_URL}/campaigns/${CHROMEOS_WAITLIST_CAMPAIGN_ID}/signups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } finally {
      setStatus("done");
    }
  };

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("chromeos-waitlist-placeholder")}
        className="max-w-56"
      />
      <Button variant="outline" disabled={status === "sending"} onClick={() => void submit()}>
        {t("chromeos-waitlist-submit")}
      </Button>
    </div>
  );
};
