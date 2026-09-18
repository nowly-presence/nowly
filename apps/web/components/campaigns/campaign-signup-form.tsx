"use client";

import { presenceApiBaseUrl } from "@/lib/presence-api";
import { Button, Input } from "@nowly/ui";
import { useState } from "react";

type CampaignSignupFormProps = {
  campaignId: string
  placeholder: string
  submitLabel: string
  successLabel: string
};

export const CampaignSignupForm = ({ campaignId, placeholder, submitLabel, successLabel }: CampaignSignupFormProps) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    try {
      const response = await fetch(`${presenceApiBaseUrl()}/campaigns/${campaignId}/signups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) throw new Error("signup failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return <p className="text-sm text-muted-foreground">{successLabel}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        className="max-w-xs"
      />
      <Button type="submit" variant="outline" disabled={status === "sending"}>
        {submitLabel}
      </Button>
      {status === "error" ? <p className="w-full text-sm text-destructive">Something went wrong. Please try again.</p> : null}
    </form>
  );
};
