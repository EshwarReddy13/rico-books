import { cn } from "@/lib/utils";

export function ReportCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ReportCardHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-start justify-between gap-3 sm:mb-5",
        className,
      )}
    >
      <h2 className="text-base font-semibold text-zinc-950 sm:text-lg">
        {title}
      </h2>
      {action}
    </div>
  );
}
