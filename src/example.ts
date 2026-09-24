import { decideBounce, sendEventNotice } from "./suppression-service.js";

const result = await decideBounce({ playerId: "player-42", email: process.env.DEMO_EMAIL_TO ?? "player@example.com", hardBounce: true, assetIds: ["asset-sword"], liveEventId: "event-summer", moderationQueue: "review" });
console.log("bounce decision:", result);
if (result.action === "deliver" && process.env.DEMO_EMAIL_TO) console.log(await sendEventNotice(process.env.DEMO_EMAIL_TO, "Summer Arena"));
