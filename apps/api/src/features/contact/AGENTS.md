# Contact

- Keep `contact.routes.ts` to validation and error mapping (`503` when `SMTP_HOST` is unset, `502` on transport failure); the SMTP transport (nodemailer, configured by the `SMTP_*` and `CONTACT_TO` env vars) lives in `sendContactMessage`.
- `website` is a honeypot field: bots get a silent no-op.
- A new field goes in the zod schema, the message body and `apps/web/features/support/components/contact-form.tsx`. Unknown fields are stripped, not rejected.
