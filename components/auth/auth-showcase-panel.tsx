import { BrandMark } from "@/components/auth/brand-mark";

export function AuthShowcasePanel() {
  return (
    <section className="relative flex h-full min-h-[28rem] flex-col overflow-hidden rounded-3xl bg-zinc-950 text-white lg:min-h-0">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-24 -right-16 h-72 w-72 rotate-12 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] opacity-[0.07]">
          <BrandMark className="size-72" variant="inverse" />
        </div>
        <div className="absolute top-0 right-0 h-40 w-40 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.08)_50%,transparent_60%)]" />
      </div>

      <div className="relative flex flex-1 flex-col justify-between p-8 md:p-10">
        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-2">
            <BrandMark className="size-8" variant="inverse" />
            <span className="text-sm font-medium tracking-wide">Rico Books</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Welcome to Rico Books
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400 md:text-base">
              Placeholder panel — your finance &amp; ITR workspace. Categorized
              P&amp;L, balance sheet, and tax prep in one place.
            </p>
          </div>

          <p className="text-sm text-zinc-500">
            Marketing content and imagery will go here.
          </p>
        </div>

        <div className="mt-10 max-w-sm rounded-2xl bg-zinc-900/80 p-5 ring-1 ring-white/10">
          <p className="text-base font-medium leading-snug">
            Get your books organized — start with your first import.
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Placeholder call-to-action card for future highlights or tips.
          </p>
          <div className="mt-4 flex justify-end">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="inline-block size-8 rounded-full border-2 border-zinc-900 bg-zinc-700"
                />
              ))}
              <span className="flex size-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-xs text-zinc-300">
                +2
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
