import type { IndustryDef } from "./types"

export const industries: IndustryDef[] = [
  {
    id: "banking",
    label: "Banking",
    icon: "landmark",
    scenarios: [
      {
        id: "fraud",
        direction: "inbound",
        title: "Fraud & Unauthorized Transactions",
        description: "Customer reports suspicious charges and a potential account compromise.",
        available: true,
      },
      {
        id: "collections",
        direction: "outbound",
        title: "Payment Collection",
        description: "Bank proactively reaches out to a customer with a past-due balance.",
        available: true,
        notification: {
          sender: "NorthStar Bank",
          body: "Daniel, your account ending 4821 needs attention. We have payment and assistance options available. Review them securely in the NorthStar app.",
        },
      },
    ],
  },
  {
    id: "travel",
    label: "Travel",
    icon: "globe",
    scenarios: [
      {
        id: "rebooking",
        direction: "inbound",
        title: "Refund & Rebooking",
        description: "Traveler contacts support after a cancellation to rebook a disrupted flight.",
        available: true,
      },
      {
        id: "disruption",
        direction: "outbound",
        title: "Flight Disruption",
        description: "Airline proactively reaches out to a traveler about a delayed flight.",
        available: true,
        notification: {
          sender: "Orchid Air",
          body: "Daniel, your flight OA720 to Tokyo Haneda tomorrow has been delayed. We've already checked alternatives — review your options in the app.",
        },
      },
    ],
  },
  {
    id: "education",
    label: "Education",
    icon: "graduation-cap",
    scenarios: [
      {
        id: "admissions",
        direction: "inbound",
        title: "Admissions & Application Support",
        description: "Applicant contacts admissions about eligibility and an in-progress application.",
        available: true,
      },
      {
        id: "enrolment",
        direction: "outbound",
        title: "Enrolment Deadline & Follow-up",
        description: "Institution proactively follows up on an incomplete enrolment before the deadline.",
        available: true,
        notification: {
          sender: "Meridian Institute",
          body: "Hi Irfan, your enrolment deadline for the Bachelor of Computing is approaching and the final step isn't complete. Let's sort it out in the app.",
        },
      },
    ],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    icon: "heart",
    scenarios: [
      {
        id: "appointment",
        direction: "inbound",
        title: "Appointment Management",
        description: "Patient requests an appointment change that trips a clinical-safety check.",
        available: false,
      },
      {
        id: "pre-visit",
        direction: "outbound",
        title: "Reminder & Pre-Visit Support",
        description: "Clinic proactively confirms an appointment and prepares the patient for the visit.",
        available: false,
      },
    ],
  },
]
