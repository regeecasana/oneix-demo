import type { CaseFile, ChatTurn, ChatTurnContent } from "./types"
import { withTurnIds } from "./turn-ids"

const fraudScriptContent: ChatTurnContent[] = [
  {
    kind: "alert",
    title: "FRAUD ALERT",
    lines: ["$1,284.67 at LUXEMARKET.COM", "Debit card ····1842 · \"This wasn't me\""],
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Hi Maya. I'm Ava. I already have the transaction you flagged — the $1,284.67 LUXEMARKET.COM charge. You said it wasn't yours. Is that correct?",
  },
  { kind: "reply", text: "Yes. I've never heard of that merchant." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "I'm sorry to hear that. Let's secure your account right away. Before I make any changes, I need to verify it's you — please confirm with Face ID.",
  },
  { kind: "faceid", text: "Identity confirmed via Face ID." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Do you still have the physical card ending in 1842 with you?",
  },
  { kind: "reply", text: "Yes, I still have it." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Does anyone else have permission to use this card or your checking account?",
  },
  { kind: "reply", text: "No. Just me." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "I'm checking your recent activity now.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "I found two more recent transactions. Please tell me if you recognize them.",
  },
  {
    kind: "transactions",
    items: [
      { label: "QuickCash ATM", amount: "$600.00", time: "Today, 9:51 AM" },
      { label: "MetroRide", amount: "$19.42", time: "Today, 8:14 AM" },
    ],
  },
  { kind: "reply", text: "Got it — please continue." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Got it — I've noted MetroRide as yours. The $600 ATM withdrawal and the $1,284.67 LUXEMARKET charge are both flagged as disputed. Because two different channels were used, I recommend freezing card 1842 right now. Your checking account stays open.",
  },
  { kind: "reply", text: "Yes — please freeze it." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Done — card ••••1842 is now frozen.",
  },
  { kind: "system", text: "Card status: BLOCKED — suspected fraud." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "One more question: in the last few days, did anyone contact you claiming to be from your bank and ask you to share a verification code or approve a notification?",
  },
  {
    kind: "reply",
    text: "Actually yes — someone called yesterday. They sent me a code and I read it back to them.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Thank you for telling me. I've already taken care of the following — you won't need to repeat any of this.",
  },
  {
    kind: "checklist",
    from: "ai",
    speaker: "Ava",
    items: [
      "Frozen card ••••1842",
      "Marked LUXEMARKET and the ATM withdrawal as disputed",
      "Kept MetroRide as yours",
      "Logged the suspicious call and code disclosure",
    ],
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Because a code may have been shared, I'm transferring you to an Account Protection specialist who can review your online access.",
  },
  { kind: "handoff", to: "Jordan", role: "Account Protection" },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Hi Maya, I'm Jordan with Account Protection. Ava's brought me up to speed.",
  },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Card 1842 is frozen, LUXEMARKET and the $600 ATM withdrawal are disputed, MetroRide is yours, and you received a suspicious call yesterday. You don't need to repeat any of that.",
  },
  { kind: "reply", text: "That's a relief. Can they still log into my bank account?" },
  { kind: "system", text: "Reviewing recent access and security changes…" },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "I found a login yesterday evening from a device we haven't seen before. I don't see any new payees or successful transfers from that session. I'm revoking all other sessions now, and replacing your card rather than unfreezing it, since its credentials should be treated as compromised.",
  },
  { kind: "reply", text: "Okay — will I be without a card tonight? I need groceries." },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "We can issue the replacement digitally first, so you can add it to your mobile wallet while the physical card is delivered. I've also opened fraud case FR-982741 covering both disputed transactions — you can track it any time under Help → Claims.",
  },
  { kind: "reply", text: "Added. Am I going to get the $1,884.67 back?" },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Both transactions are recorded as unauthorized and the investigation has started. Timing and any credit depend on the transaction type, so I don't want to promise an outcome before that runs — your claim screen will show every status change.",
  },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Everything I can see is secure now: the compromised card is blocked, the replacement is active digitally, other sessions are revoked, and your claim is open. Is there anything about today we haven't covered?",
  },
  { kind: "reply", text: "No. I thought I'd spend an hour on the phone. Thank you." },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "You're welcome, Maya. I'm glad we caught it quickly. The fraud case stays open and we'll proactively keep you updated.",
  },
  {
    kind: "status",
    title: "Customer Protection Status",
    rows: [
      { label: "Compromised card", value: "BLOCKED", positive: true },
      { label: "Replacement card", value: "ACTIVE (digital)", positive: true },
      { label: "Fraud case", value: "FR-982741" },
      { label: "Disputed transactions", value: "2" },
      { label: "Legitimate transaction", value: "PRESERVED", positive: true },
      { label: "Untrusted sessions", value: "REVOKED", positive: true },
      { label: "Customer action needed", value: "NONE", positive: true },
    ],
  },
]

export const fraudScript = withTurnIds("fraud", fraudScriptContent)

const collectionsScriptContent: ChatTurnContent[] = [
  {
    kind: "alert",
    title: "ACCOUNT NEEDS ATTENTION",
    lines: ["$286.40 past due · Rewards ••••4821", "Payment options are available."],
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Hi Daniel. You're securely signed in to NorthStar. I'm Ava. I can help with the account ending 4821 — as of today, the amount past due is $286.40. Would you like to make a payment, choose a payment date, or talk through assistance options?",
  },
  { kind: "reply", text: "I need help. I got laid off two weeks ago and the automatic payment bounced." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "I'm sorry you're dealing with that. We can look at the options together — you don't need to share more than is necessary. What would be realistic right now: the full $286.40, part of it, or some time before paying?",
  },
  { kind: "reply", text: "I can do $100 this Friday, Sep 18. I should get unemployment around Oct 2." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Thank you. I'm checking the arrangements available for your account — I won't schedule or move any money unless you review and authorize the terms.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "The standard options require the past-due amount sooner than that schedule. A hardship review is available, but this account needs specialist approval before I can offer a modified arrangement. I'll still collect the details so you won't have to start over.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "You've said $100 on Sep 18 and additional income around Oct 2 — would another payment in early October work, or would that still risk essential expenses?",
  },
  { kind: "reply", text: "Early October is fine, but rent is due the 1st, so Oct 2 or later is better." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Understood — no payment before Oct 2 beyond the $100 on Sep 18. Would you prefer future reminders by app notification rather than phone calls?",
  },
  {
    kind: "reply",
    text: "Yes. Please don't call me at work — actually, I don't work there anymore, remove that number too.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Absolutely — I've marked your former work number as unavailable for contact and set app notifications as your preference. I'll connect you now to a Payment Assistance specialist who can approve arrangements outside the standard options. You won't need to repeat anything.",
  },
  { kind: "handoff", to: "Sofia", role: "Payment Assistance" },
  {
    kind: "message",
    from: "agent",
    speaker: "Sofia",
    text: "Hi Daniel, I'm Sofia with Payment Assistance. Ava gave me the full summary — the layoff, the $100 on Sep 18, your expected income timing, and the request not to use your old work number. You don't need to go through that again.",
  },
  { kind: "reply", text: "Great — I was worried I'd have to explain the whole thing again." },
  {
    kind: "message",
    from: "agent",
    speaker: "Sofia",
    text: "I can approve an arrangement that fits your timing. Before I explain it, I want to make sure it's actually workable, not just something you agree to and struggle to keep.",
  },
  {
    kind: "payment",
    title: "Payment Arrangement — Review",
    source: "Checking ••••2207",
    rows: [
      { label: "Sep 18", amount: "$100.00" },
      { label: "Oct 2", amount: "$93.20" },
      { label: "Oct 16", amount: "$93.20" },
    ],
    total: "$286.40",
  },
  { kind: "reply", text: "Yes, I can do those dates. How do I make the payments?" },
  {
    kind: "message",
    from: "agent",
    speaker: "Sofia",
    text: "I'll open a secure authorization screen in your app with checking ••••2207 as the source — I won't ask you to type account numbers into this chat. Take your time, and tell me when it's done.",
  },
  { kind: "reply", text: "Done. It says authorized." },
  { kind: "system", text: "Arrangement PT-441872 confirmed." },
  {
    kind: "message",
    from: "agent",
    speaker: "Sofia",
    text: "I see it — arrangement PT-441872 is active, first payment $100 on Sep 18 from checking ••••2207. I've also updated your contact preference so we won't use your former work number.",
  },
  { kind: "reply", text: "Am I still going to get collection messages every day?" },
  {
    kind: "message",
    from: "agent",
    speaker: "Sofia",
    text: "No — now that you have an active arrangement, outreach switches from delinquency messaging to payment-plan servicing. You'll get an app reminder before each payment and a confirmation after each one processes.",
  },
  {
    kind: "message",
    from: "agent",
    speaker: "Sofia",
    text: "If your situation changes and a payment won't work, contact us before the date — the app brings whoever helps you straight back to this arrangement. You're all set for today, Daniel.",
  },
  { kind: "reply", text: "Thank you for actually making this manageable." },
  {
    kind: "status",
    title: "Customer Journey Status",
    rows: [
      { label: "Arrangement", value: "PT-441872" },
      { label: "Next payment", value: "$100.00 — Sep 18" },
      { label: "Future payments", value: "$93.20 — Oct 2 / Oct 16" },
      { label: "Collections outreach", value: "SUPPRESSED", positive: true },
      { label: "Plan reminders", value: "ACTIVE", positive: true },
      { label: "Former work number", value: "SUPPRESSED", positive: true },
      { label: "Customer action needed", value: "NONE until Sep 18", positive: true },
    ],
  },
]

export const collectionsScript = withTurnIds("collections", collectionsScriptContent)

export const scriptsByScenario: Record<string, ChatTurn[]> = {
  fraud: fraudScript,
  collections: collectionsScript,
}

export const caseFiles: Record<string, CaseFile> = {
  fraud: {
    id: "FR-982741",
    scenarioId: "fraud",
    customer: "Maya Chen",
    authNote: "Strongly authenticated in mobile app — Face ID passed",
    intent: "Unauthorized debit-card transactions / possible account takeover",
    facts: [
      "Physical card 1842 remains in customer's possession",
      "No authorized additional user",
      "LUXEMARKET.COM $1,284.67 — NOT AUTHORIZED",
      "QuickCash ATM $600.00 — NOT AUTHORIZED",
      "MetroRide $19.42 — AUTHORIZED",
      "Customer disclosed providing an OTP to an inbound caller yesterday",
    ],
    actionsCompleted: [
      "Card 1842 frozen",
      "Fraud case FR-982741 created",
      "Two disputed transactions attached",
      "Authorized transaction excluded",
    ],
    recommendation: [
      "Review successful and failed logins",
      "Review device enrollment and digital-wallet changes",
      "Revoke untrusted sessions",
      "Replace compromised debit card",
    ],
    reason: "Potential social-engineering / account-takeover event — OTP disclosed to unverified caller.",
  },
  collections: {
    id: "PT-441872",
    scenarioId: "collections",
    customer: "Daniel Brooks",
    authNote: "Authenticated mobile-app session",
    intent: "Delinquency outreach + hardship request",
    facts: [
      "$286.40 currently past due, 17 days delinquent",
      "Reason: recent job loss / income interruption",
      "Customer can pay $100.00 on Sep 18, 2026",
      "Additional income expected around Oct 2, 2026",
      "No second payment before Oct 2 due to essential expenses",
      "Former work phone marked invalid — suppress",
    ],
    actionsCompleted: [
      "Contact preference updated to app notifications",
      "Former work number suppressed",
      "Hardship intake completed",
    ],
    recommendation: [
      "Confirm eligibility in Collections Decision Engine",
      "Explain impact/restrictions of a modified arrangement",
      "If accepted, launch secure authorization workflow",
    ],
    reason: "Requested schedule falls outside standard offer engine — requires exception authority.",
  },
}
