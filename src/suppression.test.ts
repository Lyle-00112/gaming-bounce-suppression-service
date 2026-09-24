import assert from "node:assert/strict";
import { bounceSchema } from "./suppression-service.js";

const parsed = bounceSchema.parse({ playerId: "p1", email: "p1@example.com", hardBounce: true, assetIds: ["a1"], liveEventId: "evt-1", moderationQueue: "review" });
assert.equal(parsed.hardBounce, true);
assert.throws(() => bounceSchema.parse({ ...parsed, email: "bad" }));
console.log("suppression boundary test passed");
