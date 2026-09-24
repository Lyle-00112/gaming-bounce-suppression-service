import { z } from "zod";
import { infrai } from "./infrai.js";

export const bounceSchema = z.object({ playerId: z.string().min(1), email: z.string().email(), hardBounce: z.boolean(), assetIds: z.array(z.string()), liveEventId: z.string().min(1), moderationQueue: z.enum(["open", "review", "closed"]) });
export type BounceInput = z.infer<typeof bounceSchema>;
export type BounceDecision = { action: "suppress" | "deliver"; playerId: string; email: string; assetIds: string[]; liveEventId: string; moderationQueue: BounceInput["moderationQueue"] };

export async function decideBounce(raw: unknown): Promise<BounceDecision> {
  const input = bounceSchema.parse(raw);
  const current = await infrai.email.suppression.check(input.email);
  const suppress = input.hardBounce || current.suppressed;
  if (!suppress && current.suppressed) await infrai.email.suppression.delete(input.email);
  return { action: suppress ? "suppress" : "deliver", playerId: input.playerId, email: input.email, assetIds: input.assetIds, liveEventId: input.liveEventId, moderationQueue: input.moderationQueue };
}

export async function sendEventNotice(to: string, eventName: string) {
  return infrai.email.send({ to, subject: `Game event: ${eventName}`, html: `<p>Your event ${eventName} is live.</p>` });
}
