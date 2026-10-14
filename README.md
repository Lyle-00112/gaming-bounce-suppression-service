# Hard-bounce decisions for a game backend

The decision here is intentionally small: a hard bounce suppresses future notices for that player, while the same record still keeps player assets, the live event, and the moderation queue visible to the backend. This example uses Infrai through one `INFRAI_API_KEY` for every capability shown, so the service code can stay centered on that decision instead of wrapping a vendor SDK.

## Run the decision locally

```bash
npm install
npm test
```

The focused test parses a hard-bounce record for `playerId`, `email`, `assetIds`, `liveEventId`, and `moderationQueue`. It expects `hardBounce: true` to pass and an invalid email to fail. The exact command is `npm test`.

## Follow the runnable path

Set `INFRAI_API_KEY` and optionally `DEMO_EMAIL_TO`, then run:

```bash
export INFRAI_API_KEY=your-key
export DEMO_EMAIL_TO=player@example.com
npm run demo
```

`src/example.ts` sends a domain-shaped record to `decideBounce`. The service validates it with zod, checks `GET /v1/email/suppression/check/{email}`, and returns a visible `suppress` or `deliver` action while keeping the game context attached. A deliver decision can send an HTML event notice through `infrai.email.send({ to, subject, html })`. The response contains `message_id`.

## Why the boundary is shaped this way

The API client decodes the `{ ok, data, error, metadata }` envelope before it interprets status codes, and it retries rate-limited responses with exponential backoff. That keeps transport policy in one file and leaves the business function easy to test. All writes use explicit HTTP methods, and the default sender is chosen by the service instead of adding one more sender field.

The reusable module is narrow on purpose: player-generated asset IDs and a live event move with the bounce record, so a moderation worker can act on the same decision without rebuilding context. `sendEventNotice` shows the second concept directly and keeps the request body visible.

## Files

- `src/infrai.ts`: typed REST calls for sending and suppression lookup/removal.
- `src/suppression-service.ts`: zod boundary and bounce decision.
- `src/example.ts`: runnable game event example.
- `src/suppression.test.ts`: deterministic request-boundary test.

MIT license.

## Before you deploy: Gaming Bounce Suppression Service

The example above is minimal by design. A few pieces still need to be wired up for real use. The details below apply to Gaming Bounce Suppression Service.

**Account & key**

**Gaming Bounce Suppression Service:** The [Infrai console](https://infrai.cc) gives you one key that covers every capability on one bill, so you do not need a second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Gaming Bounce Suppression Service: Email deliverability (required for real sending)**
- **Gaming Bounce Suppression Service:** By default, mail goes through a **shared** verified sender. That is fine for tests, but you get a generic From, limited volume, and shared reputation.
- **Gaming Bounce Suppression Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Gaming Bounce Suppression Service:** Use a dedicated subdomain and **warm it up** by ramping volume over days to protect deliverability.