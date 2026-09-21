import type { CaseFile } from "./types"

/**
 * The ticket each AI-to-human handoff opens on the Agent Workspace (/agent).
 * `steps` are the technical actions the orchestrator took, written from what
 * happens in that scenario's conversation in scripts.ts.
 */
export const caseFiles: Record<string, CaseFile> = {
  fraud: {
    id: "FR-982741",
    scenarioId: "fraud",
    customer: "Maya Chen",
    subject: "Unauthorized debit charges — possible takeover",
    priority: "High",
    waiting: "2m",
    tier: "Retail Banking · Debit ••••1842",
    issue: "Fraud · Possible ATO",
    channel: "Mobile App Chat",
    summary: [
      "Maya Chen reported an unauthorized $1,284.67 LUXEMARKET.COM debit charge. Ava confirmed identity with Face ID, froze card ••••1842 and marked the $600 ATM withdrawal and LUXEMARKET as disputed, keeping MetroRide as hers. She then disclosed reading a ",
      { text: "one-time code to a caller", tone: "danger" },
      " yesterday — a ",
      { text: "possible account takeover", tone: "danger" },
      ". Card fraud is contained; her online-banking access still needs specialist review.",
    ],
    steps: [
      {
        system: "Marketing",
        label: "Fraud engine event fired the outbound journey to the app",
      },
      {
        system: "CDP",
        label: "Customer identified — profile and preferences loaded",
      },
      {
        system: "AI Orchestrator",
        label: "Step-up authentication passed (Face ID)",
      },
      {
        system: "AI Orchestrator",
        label: "Live card API queried — recent transactions retrieved",
      },
      {
        system: "Data Warehouse",
        label: "Device and location history checked for the flagged charges",
      },
      {
        system: "AI Orchestrator",
        label: "MetroRide authorized; ATM + LUXEMARKET disputed",
      },
      {
        system: "AI Orchestrator",
        label: "Card ••••1842 blocked via card-management API",
      },
      {
        system: "Data Warehouse",
        label: "OTP disclosure logged — account-takeover signal raised",
      },
      { system: "CDP", label: "Fraud case FR-982741 created" },
      {
        system: "AI Orchestrator",
        label: "Handoff package compiled for Account Protection",
      },
    ],
    handoffNote:
      "Full context transferred · Card frozen · 2 transactions disputed · ATO signal flagged · Customer briefed",
    recommendation: [
      "Review successful and failed logins",
      "Review device enrollment and digital-wallet changes",
      "Revoke untrusted sessions",
      "Replace the compromised debit card (digital issuance first)",
    ],
    profile: [
      { label: "Customer", value: "Maya Chen" },
      { label: "Segment", value: "Retail Banking" },
      { label: "Location", value: "Boston" },
      { label: "Authentication", value: "Face ID — passed" },
      { label: "Card", value: "Debit ••••1842 — blocked" },
      { label: "Preferred contact", value: "App notification" },
    ],
  },
  collections: {
    id: "PT-441872",
    scenarioId: "collections",
    customer: "Daniel Brooks",
    subject: "Hardship request — past-due Rewards card",
    priority: "Medium",
    waiting: "4m",
    tier: "Rewards Card ••••4821",
    issue: "Collections · Hardship",
    channel: "WhatsApp",
    summary: [
      "Daniel Brooks is 17 days past due ($286.40) after an automatic payment bounced following a layoff. He can pay $100 on Sep 18 and expects income around Oct 2. ",
      { text: "No standard arrangement fits that timeline", tone: "warn" },
      " and a hardship plan needs specialist approval. He asked to be contacted by app only and to drop his former work number — both already applied.",
    ],
    steps: [
      {
        system: "Marketing",
        label: "Delinquency event received — treatment stage reached",
      },
      {
        system: "Data Warehouse",
        label: "Delinquency, payment and contact history loaded",
      },
      {
        system: "Marketing",
        label: "Journey engine chose the channel from consent + preferences",
      },
      {
        system: "AI Orchestrator",
        label: "Live balance retrieved from the collections system",
      },
      {
        system: "AI Orchestrator",
        label: "Hardship signal detected (job loss, bounced payment)",
      },
      {
        system: "AI Orchestrator",
        label: "Offer engine: no standard plan matches the schedule",
      },
      { system: "CDP", label: "Contact preference set to mobile app" },
      {
        system: "Marketing",
        label: "Former work number suppressed from outreach",
      },
      {
        system: "CDP",
        label: "Case PT-441872 opened with the hardship intake",
      },
      {
        system: "AI Orchestrator",
        label: "Handoff package compiled for Payment Assistance",
      },
    ],
    handoffNote:
      "Hardship intake complete · $100 on Sep 18 · No payment before Oct 2 · Work number suppressed",
    recommendation: [
      "Confirm eligibility in the collections decision engine",
      "Suggested plan: $100 Sep 18 · $93.20 Oct 2 · $93.20 Oct 16",
      "Explain the impact of a modified arrangement",
      "If accepted, launch the secure authorization workflow",
    ],
    profile: [
      { label: "Customer", value: "Daniel Brooks" },
      { label: "Account", value: "Rewards card ••••4821" },
      { label: "Past due", value: "$286.40 (17 days)" },
      { label: "Balance", value: "$5,840.12" },
      { label: "Preferred channel", value: "Mobile app" },
      { label: "Suppressed", value: "Former work number" },
    ],
  },
  rebooking: {
    id: "OA826",
    scenarioId: "rebooking",
    customer: "Mei Lin Tan",
    subject: "Cancelled flight — companion ticket reissue",
    priority: "Medium",
    waiting: "3m",
    tier: "Orchid Air · Family Booking",
    issue: "Rebooking · Companion Ticket",
    channel: "Mobile App Chat",
    summary: [
      "Mei Lin Tan's Tokyo flight was cancelled; she is travelling with her husband Wei Ming and daughter Chloe (6). She chose the 8:15 AM Narita option and all three are seatable. Ava can rebook Mei Lin and Chloe automatically, but ",
      {
        text: "Wei Ming's ticket was issued with a miles companion redemption",
        tone: "warn",
      },
      ", which needs an authorized ticketing specialist to reissue without losing the redemption.",
    ],
    steps: [
      {
        system: "CDP",
        label: "Authenticated session resolved the customer's identity",
      },
      {
        system: "CDP",
        label: "Profile loaded — party of 3, child-meal request",
      },
      {
        system: "Data Warehouse",
        label: "Trip and seat-preference history checked",
      },
      {
        system: "AI Orchestrator",
        label: "Disruption policy + same-day inventory queried",
      },
      {
        system: "AI Orchestrator",
        label: "3 rebooking options returned; customer chose 8:15 Narita",
      },
      {
        system: "AI Orchestrator",
        label: "Auto-reissue approved for Mei Lin and Chloe",
      },
      {
        system: "AI Orchestrator",
        label: "Policy engine flagged the companion-ticket exception",
      },
      {
        system: "CDP",
        label: "Ticketing case created with a structured handoff",
      },
    ],
    handoffNote:
      "Booking, party, baggage, child meal, seating and waiver attached · Companion-ticket issue flagged",
    recommendation: [
      "Reissue Wei Ming's companion ticket, preserving the redemption",
      "Confirm seats 42A–42C together on OA826",
      "Restore Chloe's child-meal special service request",
      "Return to Ava to send the itinerary and update the trip checklist",
    ],
    profile: [
      { label: "Traveller", value: "Mei Lin Tan" },
      { label: "Party", value: "Wei Ming, Chloe (6)" },
      { label: "Original", value: "Singapore → Tokyo Haneda (cancelled)" },
      { label: "Selected", value: "OA826, 8:15 AM to Narita" },
      { label: "Special service", value: "Child meal, family seating" },
      { label: "Baggage", value: "3 checked allowances" },
    ],
  },
  disruption: {
    id: "OA712",
    scenarioId: "disruption",
    customer: "Daniel Lim",
    subject: "Delayed flight — rebooked and refunded by AI",
    priority: "Medium",
    resolvedByAi: true,
    waiting: "0m",
    tier: "Orchid Air · Frequent Business Traveller",
    issue: "Flight Delay · AI Resolved",
    channel: "WhatsApp",
    summary: [
      "OA720 to Tokyo Haneda was delayed by 3h 30m. Orchid Air's disruption feed flagged Daniel Lim before he noticed, and Ava reached out with a no-charge move to OA712 at 7:05 AM. He chose it for a 5 PM meeting. Ava reissued the ticket, kept his aisle seat (18C) and baggage, moved his app reminder to 4:45 AM, and refunded the ",
      { text: "S$48 unused extra-legroom charge", tone: "warn" },
      " (RF-804312) on request. ",
      "No human handoff was needed.",
    ],
    steps: [
      {
        system: "Marketing",
        label: "FLIGHT_DELAYED OA720 SIN-HND +210 MIN received",
      },
      {
        system: "Data Warehouse",
        label: "Affected passengers identified from booking history",
      },
      { system: "CDP", label: "Profile and seat/baggage preferences loaded" },
      {
        system: "AI Orchestrator",
        label: "Alternatives checked; OA712 offered under disruption policy",
      },
      {
        system: "Marketing",
        label: "Consent and channel checked; WhatsApp message sent",
      },
      {
        system: "AI Orchestrator",
        label: "Inventory held, waiver ticket exchange authorized",
      },
      {
        system: "AI Orchestrator",
        label: "Seat 18C restored; itinerary emailed",
      },
      { system: "Marketing", label: "App reminder moved to 4:45 AM" },
      {
        system: "AI Orchestrator",
        label: "Unused S$48 seat charge refunded (RF-804312)",
      },
    ],
    handoffNote: "Resolved by AI end to end — no handoff needed",
    recommendation: [
      "No action needed — case closed by AI",
      "Confirm the 4:45 AM departure reminder fires tomorrow",
      "Review the refund reference RF-804312 if asked",
    ],
    profile: [
      { label: "Traveller", value: "Daniel Lim" },
      {
        label: "Segment",
        value: "Regional sales director, frequent traveller",
      },
      { label: "Original", value: "OA720, delayed 3h 30m" },
      { label: "New flight", value: "OA712, 7:05 AM — seat 18C (aisle)" },
      { label: "Refund", value: "RF-804312 — S$48" },
      { label: "Preferred channel", value: "WhatsApp" },
    ],
  },
  admissions: {
    id: "AS-20641",
    scenarioId: "admissions",
    customer: "Priya Nair",
    subject: "Advanced-standing request — diploma + work experience",
    priority: "Medium",
    waiting: "5m",
    tier: "Applicant · Applied AI",
    issue: "Advanced Standing",
    channel: "Web Chat",
    summary: [
      "Priya Nair (Singapore PR) resumed her ~80% complete application and verified her Diploma in Information Technology with a digital credential. She then asked whether her diploma modules ",
      { text: "and four years of analytics experience", tone: "warn" },
      " could shorten the degree. That combination is outside the published exemption rules, so Ava prepared the case for an admissions adviser rather than answering.",
    ],
    steps: [
      {
        system: "AI Orchestrator",
        label: "Applicant status captured — Singapore PR",
      },
      {
        system: "AI Orchestrator",
        label: "Admissions rules engine confirmed the standard pathway",
      },
      { system: "CDP", label: "Saved application retrieved — 80% complete" },
      {
        system: "Data Warehouse",
        label: "Earlier visits and the abandoned steps read",
      },
      {
        system: "AI Orchestrator",
        label: "Digital credential verified (issuer signature)",
      },
      { system: "CDP", label: "Duplicate scanned-diploma requirement removed" },
      {
        system: "AI Orchestrator",
        label: "Articulation rules gap — review exception created",
      },
      {
        system: "CDP",
        label: "Admissions case opened with the verified record",
      },
    ],
    handoffNote:
      "Verified credential, transcript and employment history attached · Advanced-standing exception flagged",
    recommendation: [
      "Do not promise an exemption — the academic school decides",
      "Submit the advanced-standing review alongside the application",
      "Send the employer-reference link to the nominated referee",
      "Have the applicant complete the declaration",
    ],
    profile: [
      { label: "Applicant", value: "Priya Nair" },
      { label: "Status", value: "Singapore PR" },
      { label: "Programme", value: "Bachelor of Computing — Applied AI" },
      { label: "Qualification", value: "Diploma in IT — verified" },
      { label: "Experience", value: "4 years, data analytics" },
      { label: "Application", value: "~80% complete" },
    ],
  },
  enrolment: {
    id: "DEF-31207",
    scenarioId: "enrolment",
    customer: "Muhammad Irfan",
    subject: "Deferment request — offer expiring in 5 days",
    priority: "High",
    waiting: "1m",
    tier: "Offer Holder · Bachelor of Computing",
    issue: "Deferment · Offer Expiring",
    channel: "WhatsApp",
    summary: [
      "Muhammad Irfan has not enrolled because he is still serving National Service until August next year. Ava prepared a deferment to January 2028, but his ",
      { text: "offer expires in five days", tone: "danger" },
      " — before the standard review can finish. An admissions officer must place a temporary administrative hold.",
    ],
    steps: [
      {
        system: "Data Warehouse",
        label: "Warehouse flagged an incomplete offer journey",
      },
      {
        system: "Data Warehouse",
        label:
          "Signals read: repeat portal visits, deposit and deferment pages",
      },
      {
        system: "Marketing",
        label: "Consent + channel preference checked before outreach",
      },
      {
        system: "AI Orchestrator",
        label: "Blocker identified — National Service timing",
      },
      {
        system: "AI Orchestrator",
        label: "Deferment policy retrieved; next intake January 2028",
      },
      {
        system: "AI Orchestrator",
        label: "Offer expiry falls inside the review window",
      },
      { system: "CDP", label: "Exception case compiled for Admissions" },
    ],
    handoffNote:
      "Offer, NS completion date, requested intake and deadline attached · Temporary hold recommended",
    recommendation: [
      "Place a temporary administrative hold on the offer",
      "Submit the January 2028 deferment — no extra documents needed",
      "Confirm the original enrolment reminders stay paused",
    ],
    profile: [
      { label: "Applicant", value: "Muhammad Irfan" },
      { label: "Offer", value: "Bachelor of Computing" },
      { label: "Enrol by", value: "22 September" },
      { label: "NS completes", value: "August next year" },
      { label: "Requested intake", value: "January 2028" },
      { label: "Preferred channel", value: "WhatsApp" },
    ],
  },
  appointment: {
    id: "CARD-FU-2041",
    scenarioId: "appointment",
    customer: "Madam Lim Hoon",
    subject: "Reschedule request with new breathlessness",
    priority: "High",
    waiting: "1m",
    tier: "Patient · Cardiology",
    issue: "Clinical Safety Signal",
    channel: "Hospital App Chat",
    summary: [
      "Madam Lim, 68, asked to move her cardiology follow-up because her daughter cannot take leave. During safety screening she reported ",
      { text: "new or increased breathlessness", tone: "danger" },
      " walking this week. Ava stopped the routine reschedule, gave no diagnosis or advice, and routed her to the cardiology care team with the appointment and symptom summary.",
    ],
    steps: [
      {
        system: "CDP",
        label: "Patient identified in the hospital app; appointment retrieved",
      },
      {
        system: "AI Orchestrator",
        label: "Clinical-safety policy triggered symptom screening",
      },
      {
        system: "AI Orchestrator",
        label: "New breathlessness detected — routine reschedule stopped",
      },
      {
        system: "AI Orchestrator",
        label: "Approved safety response used — no diagnosis generated",
      },
      {
        system: "CDP",
        label: "Nurse-triage case created with the symptom summary",
      },
    ],
    handoffNote:
      "Appointment and symptom summary attached · No routine postponement made · Patient consented to handoff",
    recommendation: [
      "Assess symptoms with the approved clinical workflow",
      "Do not postpone the review — check for an earlier slot",
      "Confirm the caregiver can accompany the patient",
      "Give urgent-care instructions if symptoms worsen",
    ],
    profile: [
      { label: "Patient", value: "Madam Lim Hoon, 68" },
      { label: "Caregiver", value: "Karen (daughter)" },
      { label: "Appointment", value: "Cardiology, next Thursday 10:20 AM" },
      { label: "Reported", value: "Increased breathlessness" },
      { label: "Channel", value: "Hospital app (authenticated)" },
    ],
  },
  "pre-visit": {
    id: "CARD-PV-2041",
    scenarioId: "pre-visit",
    customer: "Madam Lim Hoon",
    subject: "Medication question before cardiology visit",
    priority: "Medium",
    waiting: "2m",
    tier: "Patient · Cardiology",
    issue: "Medication Question",
    channel: "WhatsApp",
    summary: [
      "WellSG's T-48h reminder confirmed Madam Lim's Tuesday 2:40 PM cardiology visit and shared the provider-approved pre-visit instructions. She then asked whether to ",
      { text: "stop taking her medicine before the appointment", tone: "warn" },
      ". That is outside Ava's authorized scope, so she escalated with the appointment context instead of answering.",
    ],
    steps: [
      { system: "Marketing", label: "APPOINTMENT_T_MINUS_48H event emitted" },
      {
        system: "Marketing",
        label: "Consent + channel preference checked; reminder sent",
      },
      {
        system: "CDP",
        label: "Confirmation written back to the scheduling record",
      },
      {
        system: "AI Orchestrator",
        label: "Provider-approved pre-visit instructions retrieved",
      },
      {
        system: "AI Orchestrator",
        label: "Medication question detected — outside AI scope",
      },
      {
        system: "CDP",
        label: "Care-team case created with the conversation summary",
      },
    ],
    handoffNote:
      "Appointment context and medication question attached · No medication guidance given by AI",
    recommendation: [
      "Review patient-specific medication orders under role-based access",
      "Give the approved guidance for this visit",
      "Remind her to bring the current medication list",
    ],
    profile: [
      { label: "Patient", value: "Madam Lim Hoon" },
      { label: "Appointment", value: "Cardiology, Tuesday 2:40 PM" },
      { label: "Location", value: "Cardiology Clinic — Level 3" },
      { label: "Confirmed", value: "Yes, via reminder" },
      { label: "Preferred channel", value: "WhatsApp" },
    ],
  },
}
