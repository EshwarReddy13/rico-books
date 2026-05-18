import { cn } from "@/lib/utils";

export function ProgressRing({
  percent,
  strokeClassName,
  className,
}: {
  percent: number;
  strokeClassName?: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div
      className={cn("relative size-11 sm:size-12", className)}
      aria-hidden
    >
      <svg className="size-full -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          className="stroke-zinc-100"
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          className={cn("stroke-current", strokeClassName)}
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${clamped} 100`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-zinc-700 sm:text-xs">
        {clamped}%
      </span>
    </div>
  );
}
