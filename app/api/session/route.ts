import { ROOM_PATTERN, type LiveSession } from "@/lib/oneix/live-session"
import { scriptsByScenario } from "@/lib/oneix/scripts"
import { readSession, storeKind, writeSession } from "@/lib/oneix/session-store"

const noStore = { "Cache-Control": "no-store" }

function roomFrom(value: string | null) {
  return value && ROOM_PATTERN.test(value) ? value : null
}

export async function GET(request: Request) {
  const room = roomFrom(new URL(request.url).searchParams.get("room"))
  if (!room) return Response.json({ error: "Invalid room" }, { status: 400 })

  try {
    const stored = await readSession(room)
    return Response.json(
      {
        session: stored?.session ?? null,
        ageMs: stored ? Date.now() - stored.receivedAt : null,
        store: storeKind,
      },
      { headers: noStore }
    )
  } catch {
    return Response.json(
      { error: "Store unavailable" },
      { status: 503, headers: noStore }
    )
  }
}

export async function POST(request: Request) {
  let body: { room?: string; session?: Partial<LiveSession> }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const room = roomFrom(body.room ?? null)
  const s = body.session
  const valid =
    room &&
    s &&
    typeof s.sessionId === "string" &&
    s.sessionId.length <= 64 &&
    typeof s.scenarioId === "string" &&
    s.scenarioId in scriptsByScenario &&
    Number.isInteger(s.revealed) &&
    s.revealed! >= 0 &&
    s.revealed! <= 500 &&
    typeof s.typing === "boolean" &&
    (s.status === "active" || s.status === "ended") &&
    typeof s.ts === "number"
  if (!valid)
    return Response.json({ error: "Invalid session" }, { status: 400 })

  try {
    await writeSession(room, s as LiveSession)
    return Response.json({ ok: true }, { headers: noStore })
  } catch {
    return Response.json(
      { error: "Store unavailable" },
      { status: 503, headers: noStore }
    )
  }
}
