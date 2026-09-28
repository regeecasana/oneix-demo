import type { AudioMap } from "./types"

/**
 * Maps a chat turn's stable `id` (see `turn-ids.ts`) to the voice clip that should
 * play while its bubble is "typing". Clips live under `public/audio/...` so the
 * paths below are servable directly.
 *
 * Turns are voiced incrementally — a turn with no entry here just falls back to
 * the timed typing-indicator simulation in `chat-widget.tsx`. Turns sharing a
 * `group` play back-to-back behind a single typing indicator, with `order`
 * controlling the sequence — that's how "two bubbles sent at once" would be
 * expressed for turns that are immediately consecutive in the script (a customer
 * reply between two turns breaks the run, so they just voice independently).
 *
 * Directory convention: audio/{industry}/{scenarioId}/{speakerSlug}/{clip}.mp3
 * — keyed by the actual character speaking (adam, jordan, sofia, ...) rather than
 * a fixed "ai vs agent" role, since a scenario isn't guaranteed to have exactly
 * one of each. Non-dialogue sound effects (chimes, dings) that aren't tied to a
 * character or scenario live in audio/sfx/{clip}.mp3 instead.
 */
const DING = "/audio/sfx/ding.mp3"

export const audioMap: AudioMap = {
  fraud: {
    "fraud-ai-1": { src: "/audio/bfsi/fraud/adam/1.mp3" },
    "fraud-ai-2": { src: "/audio/bfsi/fraud/adam/2.mp3" },
    // No entry for fraud-faceid-1: that turn is driven by the camera panel
    // actually opening and holding the preview, not by a clip finishing.
    "fraud-ai-3": { src: "/audio/bfsi/fraud/adam/3.mp3" },
    "fraud-ai-4": { src: "/audio/bfsi/fraud/adam/4.mp3" },
    "fraud-ai-5": { src: "/audio/bfsi/fraud/adam/5.mp3" },
    "fraud-ai-6": { src: "/audio/bfsi/fraud/adam/6.mp3" },
    "fraud-ai-7": { src: "/audio/bfsi/fraud/adam/7.mp3" },
    "fraud-ai-8": { src: "/audio/bfsi/fraud/adam/8.mp3" },
    // "Card status: BLOCKED — suspected fraud." — a backend action, not dialogue.
    "fraud-system-1": { src: DING },
    "fraud-ai-9": { src: "/audio/bfsi/fraud/adam/9.mp3" },
    "fraud-ai-10": { src: "/audio/bfsi/fraud/adam/10.mp3" },
    "fraud-ai-11": { src: "/audio/bfsi/fraud/adam/11.mp3" },
    "fraud-agent-1": { src: "/audio/bfsi/fraud/jordan/1.mp3" },
    "fraud-agent-2": { src: "/audio/bfsi/fraud/jordan/2.mp3" },
    // "Reviewing recent access and security changes…" — same idea, a system cue.
    "fraud-system-2": { src: DING },
    "fraud-agent-3": { src: "/audio/bfsi/fraud/jordan/3.mp3" },
    "fraud-agent-4": { src: "/audio/bfsi/fraud/jordan/4.mp3" },
    "fraud-agent-5": { src: "/audio/bfsi/fraud/jordan/5.mp3" },
    "fraud-agent-6": { src: "/audio/bfsi/fraud/jordan/6.mp3" },
    "fraud-agent-7": { src: "/audio/bfsi/fraud/jordan/7.mp3" },
    // "Connecting you to Jordan · Account Protection" — chime, not dialogue.
    "fraud-handoff-1": { src: DING },
  },
  collections: {
    "collections-ai-1": { src: "/audio/bfsi/collection/adam/1.mp3" },
    "collections-ai-2": { src: "/audio/bfsi/collection/adam/2.mp3" },
    "collections-ai-3": { src: "/audio/bfsi/collection/adam/3.mp3" },
    "collections-ai-4": { src: "/audio/bfsi/collection/adam/4.mp3" },
    "collections-ai-5": { src: "/audio/bfsi/collection/adam/5.mp3" },
    "collections-ai-6": { src: "/audio/bfsi/collection/adam/6.mp3" },
    "collections-ai-7": { src: "/audio/bfsi/collection/adam/7.mp3" },
    // "Here's everything I'm sharing with the specialist:" + the checklist + "You
    // won't need to repeat any of this." — one bubble, one clip covering all of it.
    "collections-checklist-1": { src: "/audio/bfsi/collection/adam/8.mp3" },
    // "Connecting to Payment Assistance" — chime, not dialogue.
    "collections-handoff-1": { src: DING },
    "collections-agent-1": { src: "/audio/bfsi/collection/jordan/1.mp3" },
    "collections-agent-2": { src: "/audio/bfsi/collection/jordan/2.mp3" },
    "collections-agent-3": { src: "/audio/bfsi/collection/jordan/3.mp3" },
    "collections-agent-4": { src: "/audio/bfsi/collection/jordan/4.mp3" },
    "collections-agent-5": { src: "/audio/bfsi/collection/jordan/5.mp3" },
    "collections-agent-6": { src: "/audio/bfsi/collection/jordan/6.mp3" },
    "collections-agent-7": { src: "/audio/bfsi/collection/jordan/7.mp3" },
  },
  admissions: {
    "admissions-ai-1": { src: "/audio/education/admission/adam/1.mp3" },
    "admissions-ai-2": { src: "/audio/education/admission/adam/2.mp3" },
    "admissions-ai-3": { src: "/audio/education/admission/adam/3.mp3" },
    // Application-progress summary (done / still needed) with its intro and outro.
    "admissions-checklist-1": { src: "/audio/education/admission/adam/4.mp3" },
    "admissions-ai-4": { src: "/audio/education/admission/adam/5.mp3" },
    // "Credential uploaded — verifying issuer signature…" — a backend action.
    "admissions-system-1": { src: DING },
    "admissions-ai-5": { src: "/audio/education/admission/adam/6.mp3" },
    "admissions-ai-6": { src: "/audio/education/admission/adam/7.mp3" },
    "admissions-ai-7": { src: "/audio/education/admission/adam/8.mp3" },
    "admissions-checklist-2": { src: "/audio/education/admission/adam/9.mp3" },
    "admissions-handoff-1": { src: DING },
    "admissions-agent-1": { src: "/audio/education/admission/jordan/1.mp3" },
    "admissions-agent-2": { src: "/audio/education/admission/jordan/2.mp3" },
    "admissions-agent-3": { src: "/audio/education/admission/jordan/3.mp3" },
    "admissions-agent-4": { src: "/audio/education/admission/jordan/4.mp3" },
    "admissions-agent-5": { src: "/audio/education/admission/jordan/5.mp3" },
  },
  enrolment: {
    "enrolment-ai-1": { src: "/audio/education/enrollment/adam/1.mp3" },
    "enrolment-ai-2": { src: "/audio/education/enrollment/adam/2.mp3" },
    "enrolment-ai-3": { src: "/audio/education/enrollment/adam/3.mp3" },
    "enrolment-ai-4": { src: "/audio/education/enrollment/adam/4.mp3" },
    "enrolment-checklist-1": { src: "/audio/education/enrollment/adam/5.mp3" },
    "enrolment-handoff-1": { src: DING },
    "enrolment-agent-1": { src: "/audio/education/enrollment/jordan/1.mp3" },
    "enrolment-agent-2": { src: "/audio/education/enrollment/jordan/2.mp3" },
    // Adam's two closing bubbles after Jordan's part — recorded into the jordan/
    // folder (clips 3 and 4), which is why Adam has 5 clips there and Jordan 4.
    "enrolment-ai-5": { src: "/audio/education/enrollment/jordan/3.mp3" },
    "enrolment-ai-6": { src: "/audio/education/enrollment/jordan/4.mp3" },
  },
  disruption: {
    "disruption-ai-1": { src: "/audio/travel/disruption/adam/1.mp3" },
    "disruption-ai-2": { src: "/audio/travel/disruption/adam/2.mp3" },
    "disruption-ai-3": { src: "/audio/travel/disruption/adam/3.mp3" },
    "disruption-ai-4": { src: "/audio/travel/disruption/adam/4.mp3" },
    "disruption-ai-5": { src: "/audio/travel/disruption/adam/5.mp3" },
  },
  rebooking: {
    "rebooking-ai-1": { src: "/audio/travel/rebook/adam/1.mp3" },
    // The three-option card (intro + Options A/B/C + closing question) is one clip.
    "rebooking-options-1": { src: "/audio/travel/rebook/adam/2.mp3" },
    "rebooking-ai-2": { src: "/audio/travel/rebook/adam/3.mp3" },
    // Prepared-request checklist, with its intro and "I'll bring in a specialist" outro.
    "rebooking-checklist-1": { src: "/audio/travel/rebook/adam/4.mp3" },
    // "Connecting you to Jordan · Ticketing Specialist" — chime, not dialogue.
    "rebooking-handoff-1": { src: DING },
    "rebooking-agent-1": { src: "/audio/travel/rebook/jordan/1.mp3" },
    "rebooking-agent-2": { src: "/audio/travel/rebook/jordan/2.mp3" },
    "rebooking-agent-3": { src: "/audio/travel/rebook/jordan/3.mp3" },
    "rebooking-ai-3": { src: "/audio/travel/rebook/adam/5.mp3" },
    "rebooking-ai-4": { src: "/audio/travel/rebook/adam/6.mp3" },
    "rebooking-ai-5": { src: "/audio/travel/rebook/adam/7.mp3" },
  },
  // No jordan/ clips recorded yet for either healthcare scenario -- Jordan's
  // turns just fall back to the timed typing simulation, same as any turn
  // with no entry here.
  appointment: {
    "appointment-ai-1": { src: "/audio/healthcare/appointment/adam/1.mp3" },
    "appointment-ai-2": { src: "/audio/healthcare/appointment/adam/2.mp3" },
    // "Connecting you to Jordan · Cardiology Care Team" — chime, not dialogue.
    "appointment-handoff-1": { src: DING },
    // "Appointment updated in patient-administration system." — a backend action.
    "appointment-system-1": { src: DING },
    "appointment-ai-3": { src: "/audio/healthcare/appointment/adam/3.mp3" },
    "appointment-ai-4": { src: "/audio/healthcare/appointment/adam/4.mp3" },
  },
  "pre-visit": {
    "pre-visit-ai-1": { src: "/audio/healthcare/previsit/adam/1.mp3" },
    "pre-visit-ai-2": { src: "/audio/healthcare/previsit/adam/2.mp3" },
    // Pre-visit instructions checklist, with its intro and "I can help with the
    // questionnaire now" outro.
    "pre-visit-checklist-1": { src: "/audio/healthcare/previsit/adam/3.mp3" },
    "pre-visit-ai-3": { src: "/audio/healthcare/previsit/adam/4.mp3" },
    // "Connecting you to Jordan · Cardiology Care Team" — chime, not dialogue.
    "pre-visit-handoff-1": { src: DING },
    "pre-visit-ai-4": { src: "/audio/healthcare/previsit/adam/5.mp3" },
  },
}
