import { createEmailClient } from "@opencoredev/email-sdk"
import { ses } from "@opencoredev/email-sdk/ses"
import { serverEnv } from "@nowly/env/server"
import { z } from "zod"

const CONTACT_EMAIL = "hello@nowly.me"

const singleLine = (max: number) =>
  z.string().trim().min(1).max(max).refine((value) => !/[\r\n]/.test(value), "must be a single line")

export const contactMessageSchema = z.object({
  name: z.string().trim().max(100).default(""),
  email: z.string().trim().email().max(254),
  subject: singleLine(160),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(500).default(""),
})

export type ContactMessage = z.infer<typeof contactMessageSchema>

export class ContactEmailNotConfiguredError extends Error {
  constructor() {
    super("Contact email is not configured")
    this.name = "ContactEmailNotConfiguredError"
  }
}

const emailClient = () => {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = serverEnv
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
    throw new ContactEmailNotConfiguredError()
  }

  return createEmailClient({
    adapters: [
      ses({
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        region: AWS_REGION,
        sessionToken: serverEnv.AWS_SESSION_TOKEN,
        configurationSetName: serverEnv.AWS_SES_CONFIGURATION_SET,
      }),
    ],
  })
}

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;")

export const sendContactMessage = async ({ name, email, subject, message }: ContactMessage): Promise<void> => {
  const safeName = name || "Not provided"
  const text = [`Name: ${safeName}`, `Email: ${email}`, `Subject: ${subject}`, "", message].join("\n")
  const html = [
    `<p><strong>Name:</strong> ${escapeHtml(safeName)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
    `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>`,
    `<p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>`,
  ].join("")

  await emailClient().send({
    from: `Nowly Contact <${CONTACT_EMAIL}>`,
    to: CONTACT_EMAIL,
    replyTo: email,
    subject: `[Nowly Contact] ${subject}`,
    text,
    html,
    tags: [{ name: "type", value: "contact-form" }],
  })
}
