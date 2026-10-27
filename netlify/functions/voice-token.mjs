// POST /api/voice-token — creates a private LiveKit room for one visitor and
// returns a short-lived token; the "shantiban-agent" voice agent is dispatched
// into the room automatically.
import crypto from "node:crypto";
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk";
import { respond } from "../lib/db.mjs";

const AGENT_NAME = "shantiban-agent";

export default async (req) => {
  if (req.method !== "POST") return respond(405, { error: "Method not allowed" }, { Allow: "POST" });

  // Only hand out tokens to pages served from this site.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) {
    return respond(403, { error: "Forbidden" });
  }

  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.error("LiveKit environment variables are not configured");
    return respond(503, { error: "Voice assistant is not available right now." });
  }

  const id = crypto.randomUUID().slice(0, 8);
  const roomName = `shantiban-${id}`;
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: `visitor-${id}`,
    name: "Website visitor",
    ttl: "10m",
  });
  token.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });
  token.roomConfig = new RoomConfiguration({ agents: [new RoomAgentDispatch({ agentName: AGENT_NAME })] });

  return respond(200, { serverUrl: LIVEKIT_URL, participantToken: await token.toJwt() });
};

export const config = { path: "/api/voice-token" };
