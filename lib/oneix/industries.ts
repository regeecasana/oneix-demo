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
      },
    ],
  },
  {
    id: "retail",
    label: "Retail",
    icon: "shopping-bag",
    scenarios: [
      {
        id: "returns",
        direction: "inbound",
        title: "Returns & Refunds",
        description: "Customer initiates a return or requests a refund for a recent purchase.",
        available: false,
      },
      {
        id: "cart",
        direction: "outbound",
        title: "Abandoned Cart Recovery",
        description: "Retailer re-engages a customer who left items in their cart.",
        available: false,
      },
    ],
  },
  {
    id: "travel",
    label: "Travel",
    icon: "globe",
    scenarios: [
      {
        id: "disruption",
        direction: "inbound",
        title: "Flight Disruption & Rebooking",
        description: "Traveler contacts support after a cancellation or significant delay to rebook.",
        available: false,
      },
      {
        id: "upgrade",
        direction: "outbound",
        title: "Loyalty & Upgrade Offer",
        description: "Airline proactively offers a seat upgrade or loyalty reward based on status.",
        available: false,
      },
    ],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    icon: "heart",
    scenarios: [
      {
        id: "billing",
        direction: "inbound",
        title: "Billing & Insurance Dispute",
        description: "Patient contacts support about an unexpected bill or a denied insurance claim.",
        available: false,
      },
      {
        id: "preventive",
        direction: "outbound",
        title: "Preventive Care Outreach",
        description: "Clinic proactively reminds patients due for annual wellness visits or screenings.",
        available: false,
      },
    ],
  },
]
