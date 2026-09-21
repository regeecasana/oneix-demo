import type { LiveSession } from "./live-session"

interface Stored {
  session: LiveSession
  /** Server clock at write time — used for "how stale is this", not the client's. */
  receivedAt: number
}

const TTL_SECONDS = 6 * 60 * 60

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN

/** "redis" once Upstash is configured; otherwise a per-process Map that only works on a single local server. */
export const storeKind: "redis" | "memory" = url && token ? "redis" : "memory"

const memory = ((
  globalThis as { __oneixSessions?: Map<string, Stored> }
).__oneixSessions ??= new Map())

async function redis(command: (string | number)[]): Promise<string | null> {
  const res = await fetch(url!, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(command),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Upstash ${res.status}`)
  const json = (await res.json()) as { result: string | null }
  return json.result
}

const keyFor = (room: string) => `oneix:session:${room}`

export async function readSession(room: string): Promise<Stored | null> {
  if (storeKind === "memory") return memory.get(room) ?? null
  const raw = await redis(["GET", keyFor(room)])
  return raw ? (JSON.parse(raw) as Stored) : null
}

export async function writeSession(
  room: string,
  session: LiveSession
): Promise<void> {
  const existing = await readSession(room)
  // Fetches from one session can land out of order; never let an older one win.
  if (
    existing &&
    existing.session.sessionId === session.sessionId &&
    existing.session.ts > session.ts
  )
    return

  const stored: Stored = { session, receivedAt: Date.now() }
  if (storeKind === "memory") {
    memory.set(room, stored)
    return
  }
  await redis(["SET", keyFor(room), JSON.stringify(stored), "EX", TTL_SECONDS])
}
