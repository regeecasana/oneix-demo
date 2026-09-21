"use client"

import { useEffect, useRef, useState } from "react"
import { TopNav } from "./top-nav"
import { Hero } from "./hero"
import { IndustryGrid } from "./industry-grid"
import { ChatWidget } from "./chat-widget"
import { WhatsAppChat } from "./whatsapp-chat"
import { NotificationToast } from "./notification-toast"
import { scriptsByScenario } from "@/lib/oneix/scripts"
import { newSessionId, publishSession } from "@/hooks/use-session-publisher"
import { HEARTBEAT_MS } from "@/lib/oneix/live-session"
import type { IndustryId, ScenarioSummary } from "@/lib/oneix/types"

export function DemoApp() {
  const [industry, setIndustry] = useState<IndustryId | null>(null)
  const [scenario, setScenario] = useState<ScenarioSummary | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  // Outbound journeys begin with a notification, before any chat exists; tell
  // the Agent Workspace about it so it can show the journey from the start.
  const notification = useRef<{ id: string; scenarioId: string } | null>(null)

  // Keep the notification stage "live" for the agent while it's on screen.
  useEffect(() => {
    if (!toastOpen) return
    const timer = setInterval(() => {
      const n = notification.current
      if (n) {
        publishSession(
          "active",
          n.id,
          { scenarioId: n.scenarioId, revealed: 0, typing: false },
          "notified"
        )
      }
    }, HEARTBEAT_MS)
    return () => clearInterval(timer)
  }, [toastOpen])

  function announceNotification(scenarioId: string) {
    const id = newSessionId()
    notification.current = { id, scenarioId }
    publishSession(
      "active",
      id,
      { scenarioId, revealed: 0, typing: false },
      "notified"
    )
  }

  function endNotification() {
    if (!notification.current) return
    const { id, scenarioId } = notification.current
    publishSession(
      "ended",
      id,
      { scenarioId, revealed: 0, typing: false },
      "notified"
    )
    notification.current = null
  }

  function handleSelectIndustry(id: IndustryId) {
    endNotification()
    setIndustry(id)
    setScenario(null)
    setChatOpen(false)
    setToastOpen(false)
  }

  function handleSelectScenario(s: ScenarioSummary) {
    if (!s.available) return
    endNotification()
    setScenario(s)
    setChatOpen(false)
    setToastOpen(false)
    if (s.direction === "outbound") {
      announceNotification(s.id)
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
              // The chat publishes its own session from here on.
              notification.current = null
              setToastOpen(false)
              setChatOpen(true)
            }}
            onDismiss={() => {
              endNotification()
              setToastOpen(false)
            }}
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
