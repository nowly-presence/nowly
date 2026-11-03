import { serverEnv } from "@nowly/env/server";
import { createTransport } from "nodemailer";
import { z } from "zod";

const SMTP_TIMEOUT_MS = 10_000;

const singleLine = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[\r\n]/.test(value), "must be a single line");

export const contactMessageSchema = z.object({
  name: z.string().trim().max(100).default(""),
  email: z.string().trim().email().max(254),
  subject: singleLine(160),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(500).default("")
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;

export class ContactEmailNotConfiguredError extends Error {
  constructor() {
    super("Contact email is not configured");
    this.name = "ContactEmailNotConfiguredError";
  }
}

const mailTransport = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD } = serverEnv;

  if (!SMTP_HOST) throw new ContactEmailNotConfiguredError();

  return createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    requireTLS: !SMTP_SECURE,
    auth: SMTP_USER && SMTP_PASSWORD ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS
  });
};

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export const sendContactMessage = async ({ name, email, subject, message }: ContactMessage): Promise<void> => {
  const safeName = name || "Not provided";
  const text = [`Name: ${safeName}`, `Email: ${email}`, `Subject: ${subject}`, "", message].join("\n");
  const html = [
    `<p><strong>Name:</strong> ${escapeHtml(safeName)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
    `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>`,
    `<p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>`
  ].join("");

  await mailTransport().sendMail({
    from: serverEnv.SMTP_FROM,
    to: serverEnv.CONTACT_TO,
    replyTo: email,
    subject: `[Nowly Contact] ${subject}`,
    text,
    html
  });
};