export function Hero() {
  return (
    <div className="relative overflow-hidden bg-linear-to-br from-teal-50 via-background to-teal-50/40 px-4 py-16 text-center sm:py-20 dark:from-[#081018] dark:via-[#0b1f26] dark:to-[#0a1a20]">
      <div
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40"
        style={{
          background:
            "radial-gradient(600px circle at 50% 0%, color-mix(in oklch, var(--color-teal-400) 22%, transparent), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300 bg-teal-100/70 px-3 py-1 text-xs font-medium text-teal-700 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-300">
          <span className="size-1.5 rounded-full bg-teal-500 dark:bg-teal-400" />
          AI-First Customer Experience Demo
        </span>
        <h1 className="mt-5 text-3xl font-semibold text-foreground sm:text-4xl">
          See an AI-first customer
          <br className="hidden sm:block" /> experience in action
        </h1>
        <p className="mt-3 text-sm text-teal-700/70 sm:text-base dark:text-teal-200/70">
          Choose an industry and scenario to begin.
        </p>
      </div>
    </div>
  )
}
