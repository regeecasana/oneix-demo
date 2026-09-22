import { ROOM_PATTERN } from "@/lib/oneix/live-session"
import { MAX_MESSAGE_LENGTH, SESSION_ID_PATTERN, type LiveMessage } from "@/lib/oneix/live-chat"
import { appendMessage, readChat, setChatOwner } from "@/lib/oneix/chat-store"

const noStore = { "Cache-Control": "no-store" }

function roomFrom(value: string | null) {
  return value && ROOM_PATTERN.test(value) ? value : null
}

function sessionIdFrom(value: string | null | undefined) {
  return value && SESSION_ID_PATTERN.test(value) ? value : null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const room = roomFrom(url.searchParams.get("room"))
  const sessionId = sessionIdFrom(url.searchParams.get("sessionId"))
  if (!room || !sessionId) {
    return Response.json({ error: "Invalid room/sessionId" }, { status: 400 })
  }

  try {
    const chat = await readChat(room, sessionId)
    return Response.json(chat, { headers: noStore })
  } catch {
    return Response.json({ error: "Store unavailable" }, { status: 503, headers: noStore })
  }
}

export async function POST(request: Request) {
  let body: {
    room?: string
    sessionId?: string
    action?: string
    message?: { from?: string; text?: string }
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const room = roomFrom(body.room ?? null)
  const sessionId = sessionIdFrom(body.sessionId)
  if (!room || !sessionId) {
    return Response.json({ error: "Invalid room/sessionId" }, { status: 400 })
  }

  try {
    if (body.action === "takeover") {
      await setChatOwner(room, sessionId, "agent")
      return Response.json({ ok: true }, { headers: noStore })
    }

    const m = body.message
    const validMessage =
      m &&
      (m.from === "agent" || m.from === "customer") &&
      typeof m.text === "string" &&
      m.text.trim().length > 0 &&
      m.text.length <= MAX_MESSAGE_LENGTH
    if (!validMessage) {
      return Response.json({ error: "Invalid message" }, { status: 400 })
    }

    const message: LiveMessage = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from: m.from as "agent" | "customer",
      text: m.text!.trim(),
      ts: Date.now(),
    }
    await appendMessage(room, sessionId, message)
    return Response.json({ ok: true, message }, { headers: noStore })
  } catch {
    return Response.json({ error: "Store unavailable" }, { status: 503, headers: noStore })
  }
}
