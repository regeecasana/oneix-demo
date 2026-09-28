import { AGENT_NAME } from "@/lib/oneix/live-chat"

const OPENAI_URL = "https://api.openai.com/v1/chat/completions"
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"
const MAX_TRANSCRIPT_LINES = 40
const MAX_LINE_LENGTH = 2000
const MAX_FIELD_LENGTH = 200

const noStore = { "Cache-Control": "no-store" }

interface TranscriptLine {
  role: "assistant" | "user"
  text: string
}

function textField(value: unknown): string {
  return typeof value === "string" ? value.slice(0, MAX_FIELD_LENGTH) : ""
}

function validTranscript(value: unknown): TranscriptLine[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const lines: TranscriptLine[] = []
  for (const entry of value.slice(-MAX_TRANSCRIPT_LINES)) {
    const raw = entry as Record<string, unknown> | null
    if (
      !raw ||
      typeof raw !== "object" ||
      (raw.role !== "assistant" && raw.role !== "user") ||
      typeof raw.text !== "string" ||
      raw.text.trim().length === 0
    ) {
      continue
    }
    lines.push({ role: raw.role, text: raw.text.slice(0, MAX_LINE_LENGTH) })
  }
  return lines.length > 0 ? lines : null
}

/**
 * Co-pilot reply suggestion: given the conversation so far, asks an LLM to
 * draft the live agent's next reply. Purely a starting point for the
 * composer -- the agent reviews, edits, and sends it themselves; nothing
 * here ever reaches the customer on its own.
 */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: "Not configured" },
      { status: 503, headers: noStore }
    )
  }

  let body: {
    customer?: unknown
    issue?: unknown
    tier?: unknown
    transcript?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: "Invalid JSON" },
      { status: 400, headers: noStore }
    )
  }

  const transcript = validTranscript(body.transcript)
  if (!transcript) {
    return Response.json(
      { error: "Invalid transcript" },
      { status: 400, headers: noStore }
    )
  }

  const customer = textField(body.customer) || "the customer"
  const issue = textField(body.issue)
  const tier = textField(body.tier)

  const systemPrompt = [
    `You are ${AGENT_NAME}, a live human support agent who has just taken over this conversation from Adam, an AI assistant, after a handoff.`,
    `You're talking with ${customer}.`,
    issue && `Case: ${issue}.`,
    tier && `Account: ${tier}.`,
    "Write only your next reply to the customer's most recent message -- 1 to 3 sentences, warm, professional, and specific to what was actually said. No preamble, no quotation marks, no signature, no restating your name.",
  ]
    .filter(Boolean)
    .join(" ")

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 200,
        messages: [
          { role: "system", content: systemPrompt },
          ...transcript.map((line) => ({
            role: line.role,
            content: line.text,
          })),
        ],
      }),
    })

    if (!res.ok) {
      return Response.json(
        { error: "Upstream error" },
        { status: 502, headers: noStore }
      )
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const suggestion = json.choices?.[0]?.message?.content?.trim()
    if (!suggestion) {
      return Response.json(
        { error: "No suggestion" },
        { status: 502, headers: noStore }
      )
    }

    return Response.json({ suggestion }, { headers: noStore })
  } catch {
    return Response.json(
      { error: "Request failed" },
      { status: 502, headers: noStore }
    )
  }
}
