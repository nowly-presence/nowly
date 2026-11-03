process.env.SMTP_HOST = "mail.example.com";
process.env.SMTP_FROM = "Nowly <hello@nowly.me>";
process.env.CONTACT_TO = "hello@nowly.me";

import { inject, mount } from "./http";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSendMail = vi.hoisted(() => vi.fn().mockResolvedValue({ messageId: "message-id" }));

vi.mock("nodemailer", () => ({ createTransport: vi.fn(() => ({ sendMail: mockSendMail })) }));

const { contactRoutes } = await import("@/features/contact/contact.routes");

describe("contact routes", () => {
  beforeEach(() => {
    mockSendMail.mockClear();
  });

  it("rejects invalid contact messages", async () => {
    const app = mount("/contact", contactRoutes);

    const response = await inject(app, {
      method: "POST",
      url: "/contact",
      payload: {
        email: "not-an-email",
        subject: "Help",
        message: "This is a message."
      }
    });

    expect(response.statusCode).toBe(400);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("sends a valid contact message to the support inbox", async () => {
    const app = mount("/contact", contactRoutes);

    const response = await inject(app, {
      method: "POST",
      url: "/contact",
      payload: {
        name: "Ada",
        email: "ada@example.com",
        subject: "A question",
        message: "I have a question about the extension."
      }
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ ok: true });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Nowly <hello@nowly.me>",
        to: "hello@nowly.me",
        replyTo: "ada@example.com",
        subject: "[Nowly Contact] A question"
      })
    );
  });

  it("accepts honeypot submissions without sending email", async () => {
    const app = mount("/contact", contactRoutes);

    const response = await inject(app, {
      method: "POST",
      url: "/contact",
      payload: {
        email: "bot@example.com",
        subject: "Spam",
        message: "This is a message.",
        website: "https://spam.example"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});