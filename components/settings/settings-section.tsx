import { cn } from "@/lib/utils";

export function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm",
        "dark:border-zinc-800 dark:bg-zinc-900",
        "sm:rounded-3xl",
        className,
      )}
    >
      <div className="border-b border-zinc-100 px-4 py-4 sm:px-6 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {children}
      </div>
    </section>
  );
}
