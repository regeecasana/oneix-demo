import { AGENT_NAME } from "@/lib/oneix/live-chat"

const OPENAI_URL = "https://api.openai.com/v1/chat/completions"
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"
const MAX_TRANSCRIPT_LINES = 60
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
    agentRole?: unknown
    transcript?: unknown
    firstReply?: unknown
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
  const agentRole = textField(body.agentRole)
  const firstReply = body.firstReply === true

  const firstName = customer.split(" ")[0]
  // The introduction is hardcoded, not left to the model -- it kept either
  // skipping it or talking about "a specialist" in the third person instead
  // of realizing that role is itself. Deterministic here, then the model
  // only has to write the natural follow-up.
  const intro = agentRole
    ? `Hi ${firstName}, this is ${AGENT_NAME}, your ${agentRole}.`
    : `Hi ${firstName}, this is ${AGENT_NAME}.`

  const systemPrompt = [
    `You are ${AGENT_NAME}, a live human support agent. Adam, an AI assistant, has already handed this conversation off to you -- the transfer is done and you are now the one actively chatting with the customer, not someone about to connect them elsewhere.`,
    agentRole
      ? `Your own title in this case is "${agentRole}". When the case or conversation mentions that role, it means you -- there is no separate person with that title. Never say you're connecting the customer to, bringing in, or working with a "${agentRole}" (or any specialist) -- that would mean referring to yourself in the third person, which makes no sense. You already are that person, speaking directly.`
      : `Never say you're connecting them, transferring them, bringing in a specialist, or that someone else will assist -- that already happened, and it was you. Speak as the specialist who is already here.`,
    `The case facts may describe what "a specialist" or "the team" will do (review, process, follow up, etc.) -- that specialist is you, so rewrite any such action in first person. Say "I'll review this and get back to you" or "I'm looking into it now," never "the specialist will review" or "you can expect a response from the specialist" -- those describe you as if you were someone else.`,
    `You're talking with ${customer}.`,
    issue && `Case: ${issue}.`,
    tier && `Account: ${tier}.`,
    `Ground your reply in the specific facts of this case and conversation above -- amounts, actions already taken, what's already resolved. Even if the customer's message is short or vague (e.g. "hi", "I need help"), you already know why they're here, so respond with that specific context instead of a generic "what do you need help with" question.`,
    firstReply
      ? `This is the very first thing the customer will see from you. A greeting -- "${intro}" -- will be added automatically before whatever you write, so do NOT write any greeting or self-introduction yourself. Just write one short, natural sentence that follows on from it, showing you already have the context Adam gave you.`
      : `You already introduced yourself earlier in this conversation, so don't do it again or restate your name -- just continue naturally.`,
    "Write only your reply -- 1 to 3 sentences, warm and professional. No preamble, no quotation marks, no signature.",
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
    const reply = json.choices?.[0]?.message?.content?.trim()
    if (!reply) {
      return Response.json(
        { error: "No suggestion" },
        { status: 502, headers: noStore }
      )
    }
    // The greeting is the hardcoded `intro`, not whatever the model produced
    // -- see above. Only the follow-up sentence is its own.
    const suggestion = firstReply ? `${intro} ${reply}` : reply

    return Response.json({ suggestion }, { headers: noStore })
  } catch {
    return Response.json(
      { error: "Request failed" },
      { status: 502, headers: noStore }
    )
  }
}
