export function Hero() {
  return (
    <div className="relative overflow-hidden bg-linear-to-br from-[#081018] via-[#0b1f26] to-[#0a1a20] px-4 py-16 text-center sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px circle at 50% 0%, rgba(45,212,191,0.18), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-300">
          <span className="size-1.5 rounded-full bg-teal-400" />
          AI-First Customer Experience Demo
        </span>
        <h1 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
          See an AI-first customer
          <br className="hidden sm:block" /> experience in action
        </h1>
        <p className="mt-3 text-sm text-teal-200/70 sm:text-base">
          Choose an industry and scenario to begin.
        </p>
      </div>
    </div>
  )
}
