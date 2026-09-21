"use client"

import { cn } from "@/lib/utils"
import { industries } from "@/lib/oneix/industries"
import { industryIcons, Check } from "./icons"
import type { IndustryId, ScenarioSummary } from "@/lib/oneix/types"

export function IndustryGrid({
  activeIndustry,
  onSelectIndustry,
  activeScenarioId,
  onSelectScenario,
  openScenarioId,
}: {
  activeIndustry: IndustryId | null
  onSelectIndustry: (id: IndustryId) => void
  activeScenarioId: string | null
  onSelectScenario: (scenario: ScenarioSummary) => void
  openScenarioId: string | null
}) {
  const current = industries.find((i) => i.id === activeIndustry)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Select an industry
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {industries.map((industry) => {
          const Icon = industryIcons[industry.icon]
          const selected = industry.id === activeIndustry
          return (
            <button
              key={industry.id}
              onClick={() => onSelectIndustry(industry.id)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border bg-card px-4 py-5 text-left transition-all",
                selected
                  ? "border-teal-400 bg-teal-50 shadow-sm dark:bg-teal-950/30"
                  : "border-border hover:border-teal-300/60 hover:shadow-sm"
              )}
            >
              {selected && (
                <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-teal-500 text-white">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              )}
              <Icon
                className={cn(
                  "size-5",
                  selected ? "text-teal-600" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  selected
                    ? "text-teal-700 dark:text-teal-300"
                    : "text-foreground"
                )}
              >
                {industry.label}
              </span>
            </button>
          )
        })}
      </div>

      {current && (
        <>
          <p className="mt-8 mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Select a scenario
          </p>
          <div className="flex flex-col gap-3">
            {current.scenarios.map((scenario) => {
              const selected = scenario.id === activeScenarioId
              const isOpen = scenario.id === openScenarioId
              return (
                <button
                  key={scenario.id}
                  disabled={!scenario.available}
                  onClick={() => onSelectScenario(scenario)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border bg-card px-5 py-4 text-left transition-all",
                    scenario.available
                      ? selected
                        ? "border-teal-400 bg-teal-50 dark:bg-teal-950/30"
                        : "border-border hover:border-teal-300/60 hover:shadow-sm"
                      : "cursor-not-allowed border-border opacity-60"
                  )}
                >
                  <span className="text-sm font-medium text-foreground">
                    {scenario.title}
                  </span>
                  <span className="mt-0.5 text-xs text-muted-foreground">
                    {scenario.description}
                  </span>
                  {isOpen && (
                    <span className="mt-2 flex items-center gap-1.5 text-xs text-teal-600">
                      <span className="size-1.5 rounded-full bg-teal-500" />
                      {scenario.direction === "inbound"
                        ? "Chat widget opened — bottom right"
                        : "Notification sent — bottom right"}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
