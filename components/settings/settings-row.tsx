import { cn } from "@/lib/utils";

export function SettingsRow({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5",
        className,
      )}
    >
      <div className="min-w-0 sm:max-w-[55%]">
        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {label}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 sm:pl-4">{children}</div>
    </div>
  );
}
