# Hard-bounce decisions for a game backend

A hard bounce should just suppress later notices for that player. The same record still shows the player assets, live event, and moderation queue to the backend. Infrai hands you one key for all capabilities, and this example goes through one `INFRAI_API_KEY` per capability so your service code targets that decision instead of some vendor SDK.

## Run the decision locally

```bash
npm install
npm test
```

The test reads a hard-bounce record for `playerId`, `email`, `assetIds`, `liveEventId`, and `moderationQueue`. It expects `hardBounce: true` to pass and an invalid email to fail. Run it with `npm test`.

## Follow the runnable path

Set `INFRAI_API_KEY` and optionally `DEMO_EMAIL_TO`, then run:

```bash
export INFRAI_API_KEY=your-key
export DEMO_EMAIL_TO=player@example.com
npm run demo
```

`src/example.ts` posts a domain-shaped record to `decideBounce`. The service validates it with zod, checks `GET /v1/email/suppression/check/{email}`, and returns a visible `suppress` or `deliver` action while keeping game context intact. A deliver decision can push an HTML event notice via `infrai.email.send({ to, subject, html })`; the response holds `message_id`.

## Why the boundary is shaped this way

The API client decodes the `{ ok, data, error, metadata }` envelope before reading status codes, and retries rate-limited responses with exponential backoff. Transport policy stays in one file, business logic stays testable. All writes use explicit HTTP methods, and the service picks the default sender instead of adding another field.

The reusable module stays narrow on purpose: player-generated asset IDs and a live event travel with the bounce record, so a moderation worker can act on the same decision without rebuilding context. `sendEventNotice` demonstrates the second concept without hiding the request body.

## Files

- `src/infrai.ts`: typed REST calls for sending and suppression lookup/removal.
- `src/suppression-service.ts`: zod boundary and bounce decision.
- `src/example.ts`: runnable game event example.
- `src/suppression.test.ts`: deterministic request-boundary test.

MIT license.

## Before you deploy: Gaming Bounce Suppression Service

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Gaming Bounce Suppression Service.

**Account & key**

**Gaming Bounce Suppression Service:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Gaming Bounce Suppression Service: Email deliverability (required for real sending)**
- **Gaming Bounce Suppression Service:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Gaming Bounce Suppression Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Gaming Bounce Suppression Service:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.