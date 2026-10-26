# Contact

`POST /`: website contact form, rate-limited 5 per 10 minutes, honeypot field `website` (bots get a silent no-op).

- `contact.routes.ts` only validates (`contactMessageSchema`) and maps errors: `503` when email is not configured (`ContactEmailNotConfiguredError`), `502` when the transport fails.
- The transport lives in `sendContactMessage` (`contact.service.ts`). Changing it should not change the route unless failure modes change.
- A new field goes in the zod schema, the message body and `apps/web/features/support/components/contact-form.tsx`. Unknown client fields are stripped by `safeParse`, not rejected.
