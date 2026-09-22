import type { ChatOwner, LiveMessage } from "./live-chat"

const TTL_SECONDS = 6 * 60 * 60
const MAX_MESSAGES = 200

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN

export const chatStoreKind: "redis" | "memory" = url && token ? "redis" : "memory"

interface MemChat {
  owner: ChatOwner
  messages: LiveMessage[]
}

const memory = ((
  globalThis as { __oneixChats?: Map<string, MemChat> }
).__oneixChats ??= new Map())

async function redis(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(url!, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(command),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Upstash ${res.status}`)
  const json = (await res.json()) as { result: unknown }
  return json.result
}

const keyFor = (room: string, sessionId: string) => `oneix:chat:${room}:${sessionId}`
const ownerKeyFor = (room: string, sessionId: string) =>
  `oneix:chatowner:${room}:${sessionId}`

export async function readChat(
  room: string,
  sessionId: string
): Promise<{ owner: ChatOwner; messages: LiveMessage[] }> {
  if (chatStoreKind === "memory") {
    return memory.get(keyFor(room, sessionId)) ?? { owner: "ai", messages: [] }
  }
  const [ownerRaw, rows] = await Promise.all([
    redis(["GET", ownerKeyFor(room, sessionId)]) as Promise<string | null>,
    redis(["LRANGE", keyFor(room, sessionId), "0", "-1"]) as Promise<string[]>,
  ])
  return {
    owner: ownerRaw === "agent" ? "agent" : "ai",
    messages: (rows ?? []).map((row) => JSON.parse(row) as LiveMessage),
  }
}

/** A human agent has taken the conversation — by accepting the scripted
 * handoff, or by clicking "Takeover" at any point in an AI conversation. */
export async function setChatOwner(
  room: string,
  sessionId: string,
  owner: ChatOwner
): Promise<void> {
  if (chatStoreKind === "memory") {
    const key = keyFor(room, sessionId)
    const current = memory.get(key) ?? { owner: "ai", messages: [] }
    memory.set(key, { ...current, owner })
    return
  }
  await redis(["SET", ownerKeyFor(room, sessionId), owner, "EX", TTL_SECONDS])
}

export async function appendMessage(
  room: string,
  sessionId: string,
  message: LiveMessage
): Promise<void> {
  if (chatStoreKind === "memory") {
    const key = keyFor(room, sessionId)
    const current = memory.get(key) ?? { owner: "ai" as ChatOwner, messages: [] }
    current.messages = [...current.messages, message].slice(-MAX_MESSAGES)
    memory.set(key, current)
    return
  }
  const key = keyFor(room, sessionId)
  await redis(["RPUSH", key, JSON.stringify(message)])
  await redis(["LTRIM", key, String(-MAX_MESSAGES), "-1"])
  await redis(["EXPIRE", key, String(TTL_SECONDS)])
}
