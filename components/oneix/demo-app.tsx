"use client"

import { useState } from "react"
import { TopNav } from "./top-nav"
import { Hero } from "./hero"
import { IndustryGrid } from "./industry-grid"
import { ChatWidget } from "./chat-widget"
import { WhatsAppChat } from "./whatsapp-chat"
import { NotificationToast } from "./notification-toast"
import { scriptsByScenario } from "@/lib/oneix/scripts"
import type { IndustryId, ScenarioSummary } from "@/lib/oneix/types"

export function DemoApp() {
  const [industry, setIndustry] = useState<IndustryId | null>(null)
  const [scenario, setScenario] = useState<ScenarioSummary | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)

  function handleSelectIndustry(id: IndustryId) {
    setIndustry(id)
    setScenario(null)
    setChatOpen(false)
    setToastOpen(false)
  }

  function handleSelectScenario(s: ScenarioSummary) {
    if (!s.available) return
    setScenario(s)
    setChatOpen(false)
    setToastOpen(false)
    if (s.direction === "outbound") {
      setToastOpen(true)
    } else {
      setChatOpen(true)
    }
  }

  function closeEverything() {
    setChatOpen(false)
    setToastOpen(false)
    setScenario(null)
  }

  const script = scenario ? scriptsByScenario[scenario.id] : null

  return (
    <div className="min-h-svh bg-background">
      <TopNav />

      <>
        <Hero />
        <IndustryGrid
          activeIndustry={industry}
          onSelectIndustry={handleSelectIndustry}
          activeScenarioId={scenario?.id ?? null}
          onSelectScenario={handleSelectScenario}
          openScenarioId={chatOpen || toastOpen ? (scenario?.id ?? null) : null}
        />

        {toastOpen && !chatOpen && scenario && scenario.notification && (
          <NotificationToast
            sender={scenario.notification.sender}
            body={scenario.notification.body}
            onReview={() => {
              setToastOpen(false)
              setChatOpen(true)
            }}
            onDismiss={() => setToastOpen(false)}
          />
        )}

        {chatOpen &&
          scenario &&
          script &&
          scenario.direction === "outbound" && (
            <WhatsAppChat
              key={scenario.id}
              scenarioId={scenario.id}
              script={script}
              onClose={closeEverything}
            />
          )}

        {chatOpen && scenario && script && scenario.direction === "inbound" && (
          <ChatWidget
            key={scenario.id}
            scenarioId={scenario.id}
            script={script}
            title={`${scenario.title} conversation`}
            badgeLabel="Inbound"
            subtitle={scenario.title}
            onClose={closeEverything}
          />
        )}
      </>
    </div>
  )
}
