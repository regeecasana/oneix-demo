import type { CaseFile, ChatTurn, ChatTurnContent } from "./types"
import { withTurnIds } from "./turn-ids"

const fraudScriptContent: ChatTurnContent[] = [
  {
    kind: "alert",
    title: "FRAUD ALERT",
    lines: [
      "$1,284.67 at LUXEMARKET.COM",
      'Debit card ····1842 · "This wasn\'t me"',
    ],
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
      {
        id: "quickcash-atm",
        label: "QuickCash ATM",
        amount: "$600.00",
        time: "Today, 9:51 AM",
        correctVerdict: "unknown",
      },
      {
        id: "metroride",
        label: "MetroRide",
        amount: "$19.42",
        time: "Today, 8:14 AM",
        correctVerdict: "mine",
      },
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
  {
    kind: "reply",
    text: "That's a relief. Can they still log into my bank account?",
  },
  { kind: "system", text: "Reviewing recent access and security changes…" },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "I found a login yesterday evening from a device we haven't seen before. I don't see any new payees or successful transfers from that session. I'm revoking all other sessions now, and replacing your card rather than unfreezing it, since its credentials should be treated as compromised.",
  },
  {
    kind: "reply",
    text: "Okay — will I be without a card tonight? I need groceries.",
  },
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
  {
    kind: "reply",
    text: "No. I thought I'd spend an hour on the phone. Thank you.",
  },
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
    lines: [
      "$286.40 past due · Rewards ••••4821",
      "Payment options are available.",
    ],
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Hi Daniel. I'm Ava. I'm reaching out about your Rewards account ending in 4821. As of today, there's a past-due balance of $286.40. I'm here to help find a solution that works for you.",
  },
  {
    kind: "reply",
    text: "I got laid off two weeks ago. The automatic payment bounced.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "I'm sorry to hear that. We can look at your options together — you don't need to explain more than is necessary.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "What would be most realistic for you right now?",
  },
  {
    kind: "reply",
    text: "I can do $100 this Friday Sep 18. Unemployment starts around Oct 2.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Thank you — I'll check what's available for your account. I won't schedule any payment without your review first.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "The standard arrangements require the full past-due amount sooner than your timeline. A hardship review is available but needs specialist approval. I'll collect what's needed so you won't have to start over.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Would you prefer future account reminders by mobile app rather than phone calls?",
  },
  {
    kind: "reply",
    text: "Yes. And please remove my old work number — I don't work there anymore.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Done — I've set mobile app as your preferred channel and marked the former work number as unavailable.",
  },
  {
    kind: "checklist",
    from: "ai",
    speaker: "Ava",
    intro: "Here's everything I'm sharing with the specialist:",
    items: [
      "$286.40 past due",
      "$100 available September 18",
      "Next payment no earlier than October 2",
      "Mobile app preferred",
      "Former work number removed",
    ],
    outro: "You won't need to repeat any of this.",
  },
  { kind: "handoff", to: "Jordan", role: "Payment Assistance" },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Hi Daniel. I'm Jordan with Payment Assistance. Ava has given me the full picture — the $100 on Sep 18, your income timing, and the work number removed.",
  },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "I've reviewed the account and can approve an arrangement that fits your timeline.",
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
  { kind: "reply", text: "Yes, those dates work for me." },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "I'll open a secure authorization screen. Your checking account ending 2207 is on file as the payment source.",
  },
  { kind: "system", text: "Customer authorized payment arrangement." },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Your arrangement PT-441872 is now active.",
  },
  { kind: "reply", text: "Will I keep getting collection messages?" },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "No — with an active arrangement, our outreach shifts from delinquency to payment-plan servicing. You'll get an app reminder before each payment and a confirmation once it processes.",
  },
  { kind: "reply", text: "That's much better." },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Before we finish: if your situation changes and one of these payments no longer works, contact us before the payment date. The app will bring you directly back to this arrangement, so Ava will see what we've already agreed.",
  },
  {
    kind: "reply",
    text: "Okay. Thank you for actually making this manageable.",
  },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "You're welcome, Daniel. You're all set for today. You'll receive the written arrangement in the app now.",
  },
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
      {
        label: "Customer action needed",
        value: "NONE until Sep 18",
        positive: true,
      },
    ],
  },
]

export const collectionsScript = withTurnIds(
  "collections",
  collectionsScriptContent
)

const rebookingScriptContent: ChatTurnContent[] = [
  {
    kind: "reply",
    text: "Hi, I just saw that our Tokyo flight tomorrow morning has been cancelled. We're travelling with our daughter and already have a hotel booked. Can you put us on another flight?",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "I'm sorry, Mei Lin. I can see the affected booking for you, Wei Ming and Chloe from Singapore to Tokyo Haneda tomorrow.\n\nI also see Chloe's child-meal request, your three checked-baggage allowances and your current seat preferences. I'll keep those in mind.\n\nLet me check the rebooking options available under today's disruption policy.",
  },
  {
    kind: "options",
    intro: "I found three options that keep all three of you together:",
    options: [
      {
        id: "narita-0815",
        heading: "Option A — 8:15 AM tomorrow",
        lines: [
          "Singapore → Tokyo Narita",
          "Arrives 4:20 PM",
          "No additional fare",
        ],
      },
      {
        id: "haneda-1310",
        heading: "Option B — 1:10 PM tomorrow",
        lines: [
          "Singapore → Tokyo Haneda",
          "Arrives 9:05 PM",
          "No additional fare",
        ],
      },
      {
        id: "haneda-0705",
        heading: "Option C — 7:05 AM the following day",
        lines: [
          "Singapore → Tokyo Haneda",
          "Arrives 2:55 PM",
          "No additional fare",
        ],
      },
    ],
    outro:
      "Would you prefer the earlier Narita arrival or to keep Haneda and arrive later?",
  },
  {
    kind: "reply",
    text: "I prefer the 8:15 flight. But will all three of us definitely be moved? My husband's ticket was redeemed using my miles.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "The 8:15 AM Narita flight has seats for all three of you.\n\nI can rebook you and Chloe automatically. Wei Ming's ticket is linked to a miles redemption, which requires a ticketing specialist to preserve the redemption correctly.",
  },
  {
    kind: "checklist",
    from: "ai",
    speaker: "Ava",
    intro:
      "I don't want you to repeat everything to another agent. I've already prepared the rebooking request with:",
    items: [
      "your preferred flight",
      "all three passenger names",
      "current baggage allowances",
      "Chloe's child meal",
      "family-seating request",
      "the disruption waiver",
      "the companion-ticket issue",
    ],
    outro: "I'll bring in a ticketing specialist now.",
  },
  { kind: "handoff", to: "Jordan", role: "Ticketing Specialist" },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Hi Mei Lin, I'm Jordan. Ava has passed everything to me, so you don't need to explain the situation again.",
  },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "I can see the 8:15 AM Narita option you selected. I'm just fixing the companion miles redemption on Wei Ming's ticket so that all three tickets are reissued together.",
  },
  { kind: "reply", text: "Thank you. Please make sure we sit together." },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Absolutely. I've secured 42A, 42B and 42C together and restored Chloe's child meal.\n\nAll three tickets have now been reissued.",
  },
  {
    kind: "status",
    title: "New Flight",
    rows: [
      { label: "Flight", value: "OA826" },
      { label: "Departure", value: "Tomorrow, 8:15 AM" },
      { label: "Route", value: "Singapore Changi → Tokyo Narita" },
      { label: "Seats", value: "42A, 42B, 42C" },
    ],
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "I've sent the new flight itinerary to your email.\n\nYour original booking was disrupted by the airline, so there was no rebooking fare difference in this policy.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Would you like me to update the airport-transfer details in your trip checklist from Haneda to Narita?",
  },
  { kind: "reply", text: "Yes please." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Done. I've updated your trip checklist for Narita.\n\nHave a good trip, Mei Lin. I hope the rest of your journey is much smoother.",
  },
  {
    kind: "status",
    title: "Trip Status",
    rows: [
      { label: "Flight OA826", value: "CONFIRMED", positive: true },
      { label: "Family seating", value: "TOGETHER", positive: true },
      { label: "Companion ticket", value: "REISSUED", positive: true },
      { label: "Fare difference", value: "NONE", positive: true },
      { label: "Trip checklist", value: "UPDATED (Narita)", positive: true },
      { label: "Customer action needed", value: "NONE", positive: true },
    ],
  },
]

export const rebookingScript = withTurnIds("rebooking", rebookingScriptContent)

const disruptionScriptContent: ChatTurnContent[] = [
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Hi Daniel, this is Orchid Air.\n\nYour flight OA720 from Singapore to Tokyo Haneda tomorrow has been delayed by 3 hours 30 minutes.\n\nI've already checked alternatives based on your booking.\n\nI can move you to OA712 at 7:05 AM, arriving Tokyo at 2:55 PM, with no rebooking charge under today's disruption policy.\n\nYour aisle-seat preference and checked baggage can be retained.",
  },
  {
    kind: "reply",
    text: "Move me to the 7:05. I have a 5pm meeting in Marunouchi.",
    choices: [
      { label: "Keep delayed flight" },
      { label: "Move me to 7:05 AM", correct: true },
      { label: "Show other options" },
    ],
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Understood. The earlier flight is the safer option for that schedule.\n\nI'm holding your seat while I reissue the ticket.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Done — you're now confirmed on OA712 departing Singapore at 7:05 AM.\n\nYour seat is 18C, aisle.\n\nI've sent your updated itinerary and boarding information to your email.\n\nBecause the new departure is earlier, I've also changed your app reminder to 4:45 AM Singapore time.",
  },
  {
    kind: "reply",
    text: "Great. What happens to the seat upgrade I paid for on the original flight?",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Your paid extra-legroom seat could not be matched on the new flight. I can see a S$48 unused charge on the disrupted itinerary.\n\nI can submit that amount for refund to the original payment method now.",
  },
  { kind: "reply", text: "Yes, refund it." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Done. Refund reference RF-804312 has been created for S$48.\n\nYou don't need to submit a separate claim.",
  },
  {
    kind: "status",
    title: "Trip Status",
    rows: [
      { label: "Flight", value: "OA712 — 7:05 AM" },
      { label: "Seat", value: "18C, aisle — retained" },
      { label: "App reminder", value: "Updated to 4:45 AM" },
      { label: "Refund", value: "RF-804312 — S$48", positive: true },
      { label: "Customer action needed", value: "NONE", positive: true },
    ],
  },
]

export const disruptionScript = withTurnIds(
  "disruption",
  disruptionScriptContent
)

const admissionsScriptContent: ChatTurnContent[] = [
  {
    kind: "reply",
    text: "Hi. I'm thinking of applying for the Applied AI degree, but I'm not sure whether I'm eligible because I have a poly diploma and I've been working for four years.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Hi Priya. I can help you check the entry pathway and, if you'd like, take you through the application step by step.\n\nYou don't need to upload anything yet.\n\nAre you applying as a Singapore Citizen, Permanent Resident or international applicant?",
  },
  { kind: "reply", text: "PR." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Thanks. And is your highest qualification a Singapore polytechnic diploma?",
  },
  { kind: "reply", text: "Yes, Diploma in Information Technology." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Great. Based on the programme rules in our admissions system, that qualification can be assessed for admission to the Applied AI programme.\n\nBecause you also have four years of relevant work experience, there may be a separate assessment for advanced standing, but that decision has to be made by the academic admissions team.",
  },
  {
    kind: "reply",
    text: "Continue my application.",
    choices: [
      { label: "Check my admission requirements" },
      { label: "Continue my existing application", correct: true },
      { label: "Ask about advanced standing" },
    ],
  },
  {
    kind: "checklist",
    from: "ai",
    speaker: "Ava",
    intro:
      "I found the application you started on September 8. You're about 80% complete. You do not need to restart it.\n\nHere's what's already complete:",
    items: [
      "Personal information",
      "Employment history",
      "Programme selection",
      "Personal statement",
    ],
    pending: [
      "Academic credential",
      "Employer reference",
      "Application declaration",
    ],
    outro:
      "Your academic credential appears to be available as a digital certificate. Would you like to provide the digital credential instead of uploading scanned copies?",
  },
  { kind: "reply", text: "Yes. I have the digital certificate." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Please share it through the secure upload panel. The file will be used for your admissions assessment.",
  },
  { kind: "system", text: "Credential uploaded — verifying issuer signature…" },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Verified.",
  },
  {
    kind: "status",
    title: "Credential Verified",
    rows: [
      { label: "Qualification", value: "Diploma in Information Technology" },
      { label: "Award status", value: "Verified", positive: true },
    ],
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "You no longer need to upload a separate scanned diploma for this requirement.\n\nYour application is now missing only the employer reference and declaration.",
  },
  {
    kind: "reply",
    text: "Actually, I was hoping some of my diploma modules and work experience could shorten the degree. Can you check that too?",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "I can check the published exemptions, but your case goes beyond the standard rules because you're asking us to consider both prior study and professional experience.\n\nI can already see the relevant information, so let me prepare the assessment rather than asking you to explain it again.",
  },
  {
    kind: "checklist",
    from: "ai",
    speaker: "Ava",
    intro: "I have:",
    items: [
      "your verified diploma",
      "your transcript",
      "four years of data-analytics employment history",
      "your requested Applied AI programme",
    ],
    outro:
      "I'll bring in an admissions adviser who can review whether this should go to the academic credit-assessment panel.",
  },
  { kind: "handoff", to: "Jordan", role: "Admissions" },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Hi Priya, I'm Jordan from Admissions.\n\nAva has passed me your application and the verified credential, including your request for advanced standing.\n\nI can see you've completed modules in databases, programming and statistics, plus your recent analytics experience.\n\nI can't promise an exemption at this stage because the academic school makes the final decision, but I can submit the assessment request now without asking you for the same documents again.",
  },
  {
    kind: "reply",
    text: "Yes please. Do I need to wait for that before submitting my application?",
  },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "No. You should submit the admissions application first. The review can run alongside it.\n\nI've created the request and attached the verified transcript.",
  },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Priya, your advanced-standing review has been created as AS-20641.\n\nTo finish the admissions application, only two actions remain:\nEmployer reference — I can email your nominated referee a secure link.\nDeclaration — you can complete this now.\n\nShall we finish both?",
  },
  {
    kind: "reply",
    text: "Yes. Send the reference to my manager, Melissa Wong.",
  },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "I found Melissa Wong in the contact details you entered earlier: m•••••@company.example.\n\nPlease confirm that's the correct referee.",
  },
  { kind: "reply", text: "Correct." },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Sent.\n\nI'll notify you when the reference arrives. You won't need to keep checking the portal manually.",
  },
  {
    kind: "status",
    title: "Application Status",
    rows: [
      { label: "Admissions application", value: "In progress" },
      { label: "Academic credential", value: "VERIFIED", positive: true },
      { label: "Advanced-standing review", value: "AS-20641 — Under review" },
      {
        label: "Employer reference",
        value: "Sent to Melissa Wong",
        positive: true,
      },
      { label: "Declaration", value: "Pending — Priya to complete" },
    ],
  },
]

export const admissionsScript = withTurnIds(
  "admissions",
  admissionsScriptContent
)

const enrolmentScriptContent: ChatTurnContent[] = [
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Hi Irfan, congratulations again on your offer for the Bachelor of Computing at Meridian Institute.\n\nYour enrolment deadline is 22 September, and I can see that the final enrolment step hasn't been completed.\n\nI can help you finish it now, or answer anything that's holding you back.",
  },
  {
    kind: "reply",
    text: "I have a question. I'm still serving National Service. I won't finish until next year. What should I do?",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Thanks for telling me. You shouldn't accept an enrolment date that you know you can't attend.\n\nMeridian has a deferment process for applicants who cannot start their offered enrolment. I can begin the request using the information already in your application.\n\nI need to confirm one thing: when do you expect to complete National Service?",
  },
  { kind: "reply", text: "August next year." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Thank you.\n\nBased on that date, the next suitable enrolment in the calendar is January 2028. I can prepare a deferment request for that.\n\nYour admissions offer will remain pending until Admissions approves the change.\n\nShall I submit the request?",
  },
  {
    kind: "reply",
    text: "Yes. But my offer expires in five days. Will I lose my place while they review it?",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Good question.\n\nBecause your offer expires before the standard deferment review is expected to finish, I need an admissions officer to place a temporary hold on the offer.",
  },
  {
    kind: "checklist",
    from: "ai",
    speaker: "Ava",
    intro: "I've already prepared the case with:",
    items: [
      "your current offer",
      "expected National Service completion date",
      "requested January 2028 enrolment",
      "current enrolment deadline",
    ],
    outro: "I'm connecting you now.",
  },
  { kind: "handoff", to: "Jordan", role: "Admissions" },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Hi Irfan. I've reviewed Ava's summary.\n\nI've placed a temporary administrative hold on the offer while we process your deferment request, so the current five-day deadline won't automatically close this application during the review.",
  },
  { kind: "reply", text: "That's a relief. Do I need to send anything?" },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "No additional document is required at this stage under our policy.\n\nI've submitted the request for the January 2028 enrolment. You'll receive the formal decision through your applicant portal.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Done. Your application status is now:",
  },
  {
    kind: "status",
    title: "Application Status",
    rows: [
      { label: "Offer", value: "Active — administrative hold", positive: true },
      { label: "Deferment", value: "Under review" },
      { label: "Requested enrolment", value: "January 2028" },
      { label: "Enrolment reminders", value: "PAUSED", positive: true },
    ],
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "I've paused the original enrolment reminders so you won't keep receiving deadline messages.\n\nI'll notify you when the deferment decision is available.",
  },
]

export const enrolmentScript = withTurnIds("enrolment", enrolmentScriptContent)

const appointmentScriptContent: ChatTurnContent[] = [
  {
    kind: "reply",
    text: "Can I change my cardiology appointment next Thursday? My daughter cannot take leave that day.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Of course, Madam Lim. I can help with the appointment.\n\nI can see your cardiology follow-up next Thursday at 10:20 AM.\n\nBefore I offer later dates, I need to check two safety questions that apply to this type of appointment.\n\nAre you asking to change it only because of scheduling, or has anything about your health changed since your last visit?",
  },
  {
    kind: "reply",
    text: "Mostly because of my daughter. But I've been a bit more breathless when walking to the market this week.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Thank you for telling me.\n\nBecause you've mentioned new or increased breathlessness, I don't want to simply move your cardiology appointment to a later date without a clinician reviewing that change.\n\nI won't try to diagnose the cause here.\n\nI can connect you to the cardiology care team now and give them the appointment and symptom information you've already shared.",
  },
  { kind: "reply", text: "Yes please." },
  { kind: "handoff", to: "Jordan", role: "Cardiology Care Team" },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Hello Madam Lim, I'm Jordan from the cardiology care team.\n\nAva has told me you wanted to move next Thursday's appointment because your daughter can't attend, and that you've noticed more breathlessness while walking this week.\n\nI'll ask you a few questions so we can decide the safest next step.",
  },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Based on the information you've given me, I'd prefer that we do not postpone your review.\n\nI've checked the clinic schedule and can offer an earlier assessment on Tuesday at 2:40 PM.\n\nWould your daughter be able to accompany you then?",
  },
  { kind: "reply", text: "Tuesday is much better. Yes." },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Good. I'll change the appointment to Tuesday at 2:40 PM.",
  },
  {
    kind: "system",
    text: "Appointment updated in patient-administration system.",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Your appointment has been updated:",
  },
  {
    kind: "status",
    title: "Appointment Updated",
    rows: [
      { label: "Clinic", value: "Cardiology" },
      { label: "When", value: "Tuesday, 2:40 PM", positive: true },
      { label: "Details sent to", value: "Your app" },
      { label: "Pre-visit instructions", value: "Available in app" },
    ],
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "I've sent the new appointment details to your app. The care team's approved pre-visit instructions are also available there.\n\nIf your symptoms worsen before the appointment, please follow the urgent-care instructions Nurse Jordan provided rather than waiting for the scheduled visit.",
  },
]

export const appointmentScript = withTurnIds(
  "appointment",
  appointmentScriptContent
)

const previsitScriptContent: ChatTurnContent[] = [
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Hi Madam Lim, a reminder from WellSG Health.\n\nYou have an appointment on:",
  },
  {
    kind: "status",
    title: "Upcoming Appointment",
    rows: [
      { label: "Date", value: "Tuesday, October 2" },
      { label: "Time", value: "2:40 PM" },
      { label: "Where", value: "Cardiology Clinic — Level 3" },
    ],
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "Would you like to confirm, change the appointment or review your pre-visit instructions?",
  },
  {
    kind: "reply",
    text: "Confirm. What do I need to do before I come?",
    choices: [
      { label: "Confirm", correct: true },
      { label: "Change the appointment" },
      { label: "Review pre-visit instructions" },
    ],
  },
  {
    kind: "checklist",
    from: "ai",
    speaker: "Ava",
    intro:
      "Your appointment is confirmed.\n\nFor this visit, your care team's instructions are:",
    items: [
      "Complete the pre-visit questionnaire",
      "Bring your current medication list",
      "Arrive 15 minutes before the appointment",
    ],
    outro: "I can help you with the questionnaire now.",
  },
  {
    kind: "reply",
    text: "I have a question. The instructions mention bringing my medication list. Should I stop taking my medicine before the appointment?",
  },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "I understand your concern.\n\nI don't want to provide medication instructions that may not apply specifically to you.\n\nI can connect you with the cardiology care team so they can provide the correct guidance. I will share your appointment details and question with them so you do not need to repeat the information.",
  },
  { kind: "reply", text: "Yes, please connect me." },
  { kind: "handoff", to: "Jordan", role: "Cardiology Care Team" },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Hello Madam Lim, I'm Jordan from the cardiology care team.\n\nAva has shared your question about your medication and your upcoming cardiology appointment.\n\nI understand you want to confirm whether there are any medication instructions before your visit. Let me review your appointment details and provide the appropriate guidance.",
  },
  {
    kind: "message",
    from: "agent",
    speaker: "Jordan",
    text: "Based on your appointment instructions, please continue taking your medication as prescribed by your doctor.\n\nFor your upcoming visit, please bring your current medication list so our cardiology team can check it with you.",
  },
  { kind: "reply", text: "Thank you. That helps." },
  {
    kind: "message",
    from: "ai",
    speaker: "Ava",
    text: "You're welcome.\n\nYour appointment remains confirmed for Tuesday at 2:40 PM. If you have any other concerns before your visit, please contact us.",
  },
  {
    kind: "status",
    title: "Appointment Status",
    rows: [
      { label: "Appointment", value: "CONFIRMED", positive: true },
      { label: "Pre-visit instructions", value: "SENT", positive: true },
      {
        label: "Medication question",
        value: "ANSWERED by care team",
        positive: true,
      },
      { label: "Care-team interaction", value: "RECORDED", positive: true },
      {
        label: "Customer action needed",
        value: "Questionnaire + medication list",
      },
    ],
  },
]

export const previsitScript = withTurnIds("pre-visit", previsitScriptContent)

export const scriptsByScenario: Record<string, ChatTurn[]> = {
  fraud: fraudScript,
  collections: collectionsScript,
  rebooking: rebookingScript,
  disruption: disruptionScript,
  admissions: admissionsScript,
  enrolment: enrolmentScript,
  appointment: appointmentScript,
  "pre-visit": previsitScript,
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
    reason:
      "Potential social-engineering / account-takeover event — OTP disclosed to unverified caller.",
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
    reason:
      "Requested schedule falls outside standard offer engine — requires exception authority.",
  },
  rebooking: {
    id: "OA826",
    scenarioId: "rebooking",
    customer: "Mei Lin Tan",
    authNote: "Authenticated mobile-app session",
    intent:
      "Disrupted flight rebooking with a loyalty companion-ticket exception",
    facts: [
      "Party: Mei Lin Tan, Wei Ming, Chloe (age 6)",
      "Original flight to Tokyo Haneda cancelled",
      "Selected replacement: OA826, tomorrow 8:15 AM, Singapore → Tokyo Narita",
      "Wei Ming's ticket issued via loyalty companion redemption",
      "Chloe has a child-meal request and needs family seating",
      "Disruption waiver applies — no rebooking fare difference",
    ],
    actionsCompleted: [
      "Mei Lin and Chloe rebooked onto OA826 automatically",
      "Rebooking request prepared for ticketing specialist",
      "Baggage, child meal and family-seating requests carried over",
    ],
    recommendation: [
      "Reissue Wei Ming's companion ticket preserving the miles redemption",
      "Confirm family seating together",
      "Restore child-meal special service request",
    ],
    reason:
      "Companion miles-redemption ticket requires an authorized ticketing specialist to reissue correctly.",
  },
  admissions: {
    id: "AS-20641",
    scenarioId: "admissions",
    customer: "Priya Nair",
    authNote: "Authenticated applicant portal session",
    intent:
      "Advanced-standing review combining prior diploma study and work experience",
    facts: [
      "Singapore PR, applying to Bachelor of Computing — Applied AI",
      "Diploma in Information Technology — credential verified",
      "Four years of data-analytics employment experience",
      "Standard exemption rules don't cover combined study + work experience",
      "Admissions application otherwise ~80% complete",
    ],
    actionsCompleted: [
      "Diploma credential verified via digital certificate",
      "Advanced-standing review request prepared",
      "Verified transcript attached to the review",
    ],
    recommendation: [
      "Determine whether the case should go to the academic credit-assessment panel",
      "Confirm exemption outcome cannot be promised before academic school review",
      "Send employer reference request to nominated referee",
    ],
    reason:
      "Requested exemption combines prior study and work experience, which falls outside published articulation rules.",
  },
  enrolment: {
    id: "AS-20641-DEF",
    scenarioId: "enrolment",
    customer: "Muhammad Irfan",
    authNote: "Authenticated applicant portal session",
    intent:
      "Enrolment deferment due to National Service, offer expiring within the review window",
    facts: [
      "Conditional offer: Bachelor of Computing, enrolment deadline 22 September",
      "Currently serving National Service — expected completion August next year",
      "Requested enrolment: January 2028",
      "Offer expires in 5 days, before standard deferment review would finish",
    ],
    actionsCompleted: [
      "Deferment request prepared for January 2028 enrolment",
      "Original enrolment reminders paused",
    ],
    recommendation: [
      "Place a temporary administrative hold on the offer",
      "Process the deferment request without requiring additional documents",
    ],
    reason:
      "Offer expiry falls inside the standard deferment review window — requires an authorized administrative hold.",
  },
  appointment: {
    id: "CARD-FU-2041",
    scenarioId: "appointment",
    customer: "Madam Lim Hoon",
    authNote: "Authenticated hospital app session",
    intent:
      "Cardiology follow-up reschedule request with a new clinical-safety signal",
    facts: [
      "Cardiology follow-up next Thursday, 10:20 AM",
      "Requested change reason: daughter (registered caregiver) cannot take leave",
      "Customer reports new or increased breathlessness walking this week",
      "Routine postponement stopped by clinical-safety policy",
    ],
    actionsCompleted: [
      "Symptom screening completed before offering later dates",
      "No diagnosis or clinical advice given by AI",
      "Appointment and symptom summary attached to the nurse-triage case",
    ],
    recommendation: [
      "Assess symptoms per the approved clinical workflow",
      "Check clinic schedule for an earlier assessment slot",
      "Confirm caregiver can accompany the patient",
    ],
    reason:
      "New or worsening symptom mentioned — routine rescheduling is not permitted without clinician review.",
  },
  "pre-visit": {
    id: "CARD-PV-2041",
    scenarioId: "pre-visit",
    customer: "Madam Lim Hoon",
    authNote: "Authenticated hospital app session",
    intent: "Medication-related question during pre-visit support",
    facts: [
      "Cardiology appointment Tuesday, 2:40 PM — confirmed via reminder",
      "Pre-visit instructions provided: questionnaire, medication list, arrive 15 min early",
      "Customer asked whether to stop taking medication before the visit",
    ],
    actionsCompleted: [
      "Appointment confirmation written back to the scheduling record",
      "Provider-approved pre-visit instructions shared",
      "Medication question escalated without AI giving medication guidance",
    ],
    recommendation: [
      "Review patient-specific medication orders under role-based credentials",
      "Provide the approved guidance to the patient",
    ],
    reason:
      "Medication advice is outside the AI's authorized scope — requires a licensed clinician.",
  },
}
