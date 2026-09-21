"use client";

import { Button, Card, CardContent, CardDescription, CardTitle, Input, Label, Textarea } from "@nowly/ui";
import { useState } from "react";

import { presenceApiBaseUrl } from "@/lib/presence-api";
import { useTranslations } from "next-intl";

type FormStatus = "idle" | "sending" | "success" | "error";

export const ContactForm = () => {
  const t = useTranslations("supportPage.contact");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", website: "" });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (status !== "idle") setStatus("idle");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch(`${presenceApiBaseUrl()}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("contact request failed");
      setForm({ name: "", email: "", subject: "", message: "", website: "" });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <Card className="max-w-none">
      <CardContent>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription className="mt-2">{t("description")}</CardDescription>
        <p className="mt-4 text-xs text-muted-foreground">{t("required-note")}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <Input
              id="contact-website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => updateField("website", event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">{t("name")}</Label>
              <Input
                id="contact-name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                autoComplete="name"
                maxLength={100}
                placeholder={t("name-placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">
                {t("email")} <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                required
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                autoComplete="email"
                maxLength={254}
                placeholder={t("email-placeholder")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-subject">
              {t("subject")} <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="contact-subject"
              required
              value={form.subject}
              onChange={(event) => updateField("subject", event.target.value)}
              maxLength={160}
              placeholder={t("subject-placeholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-message">
              {t("message")} <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Textarea
              id="contact-message"
              required
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              minLength={10}
              maxLength={5000}
              rows={6}
              placeholder={t("message-placeholder")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? t("sending") : t("submit")}
            </Button>
            {status === "success" ? <p className="text-sm text-muted-foreground" aria-live="polite">{t("success")}</p> : null}
            {status === "error" ? <p className="text-sm text-destructive" aria-live="polite">{t("error")}</p> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
