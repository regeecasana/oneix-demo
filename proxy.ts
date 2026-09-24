import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const GATE_COOKIE = "oneix_agent_gate"

/**
 * Keeps /agent off-limits to anyone who hasn't entered the booth passcode at
 * /agent-gate. The public site (the actual demo prospects click through) is
 * left completely alone -- this only ever matches /agent, see `config` below.
 */
export function proxy(req: NextRequest) {
  if (req.cookies.get(GATE_COOKIE)?.value === "1") {
    return NextResponse.next()
  }

  const url = req.nextUrl.clone()
  url.pathname = "/agent-gate"
  url.search = ""
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/agent"],
}
