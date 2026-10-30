# Contact

- Keep `contact.routes.ts` to validation and error mapping (`503` when email is not configured, `502` on transport failure); the transport lives in `sendContactMessage`.
- `website` is a honeypot field: bots get a silent no-op.
- A new field goes in the zod schema, the message body and `apps/web/features/support/components/contact-form.tsx`. Unknown fields are stripped, not rejected.
