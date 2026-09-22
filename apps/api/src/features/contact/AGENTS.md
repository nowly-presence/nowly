# Contact

The website's contact form endpoint: `POST /`, rate-limited to 5 requests/10 minutes, with a honeypot field (`website`) that silently no-ops for bots.

## Change what happens to a submitted message

Edit `contact.service.ts`'s `sendContactMessage` — the route in `contact.routes.ts` only validates the body (via `contactMessageSchema`) and maps errors, it has no knowledge of the transport. To switch from email to something else (e.g. a webhook), replace the implementation inside `sendContactMessage` and update/remove `ContactEmailNotConfiguredError` accordingly — the route's `503`/`502` mapping only needs to change if the new transport has different failure modes worth distinguishing.

## Add a new field to the form

1. Add the field to `contactMessageSchema` (zod) in `contact.service.ts`.
2. Add it to `sendContactMessage`'s message body.
3. Add the field to `apps/web`'s contact form (`features/support/components/contact-form.tsx`) — a field sent by the client but missing from the schema is silently stripped by zod's `safeParse`, not an error.

## Notable dependencies
Server-side email sending service (see `ContactEmailNotConfiguredError` in `contact.service.ts` for how "not configured" is detected).
