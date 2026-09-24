import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const GATE_COOKIE = "oneix_agent_gate"

export const metadata = {
  title: "oneix · Agent Workspace",
}

async function unlock(formData: FormData) {
  "use server"
  const passcode = String(formData.get("passcode") ?? "")
  const next = String(formData.get("next") ?? "/agent")

  // Fails closed: with AGENT_PASSCODE unset, nothing can ever unlock this.
  if (passcode && process.env.AGENT_PASSCODE && passcode === process.env.AGENT_PASSCODE) {
    const jar = await cookies()
    jar.set(GATE_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // a booth shift, not a permanent pass
    })
    redirect(next)
  }

  redirect(`/agent-gate?next=${encodeURIComponent(next)}&error=1`)
}

export default async function AgentGatePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next = "/agent", error } = await searchParams

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-navy text-sm font-bold text-white dark:bg-brand-teal dark:text-brand-navy">
            O
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-foreground">oneix</div>
            <div className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Agent Workspace
            </div>
          </div>
        </div>

        <h1 className="text-lg font-semibold text-foreground">Booth access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This is the internal Agent Workspace, not the demo itself. Enter
          the booth passcode to continue.
        </p>

        <form action={unlock} className="mt-5 space-y-3">
          <input type="hidden" name="next" value={next} />
          <input
            type="password"
            name="passcode"
            autoFocus
            placeholder="Passcode"
            className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground outline-none focus:border-brand-teal"
          />
          {error && (
            <p className="text-xs font-medium text-brand-navy dark:text-brand-teal">
              That passcode didn&apos;t work — try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-navy/85 dark:bg-brand-teal dark:text-brand-navy dark:hover:bg-brand-teal/85"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
