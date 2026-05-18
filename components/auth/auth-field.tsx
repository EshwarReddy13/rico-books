import type { LucideIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function AuthField({
  id,
  label,
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  icon: LucideIcon;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Label htmlFor={id} className="text-black">
        {label}
      </Label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black"
          aria-hidden
        />
        <Input
          id={id}
          className="h-11 border border-neutral-200 bg-white pl-10 text-base text-black shadow-none placeholder:text-neutral-400 focus-visible:border-neutral-300 focus-visible:bg-white disabled:bg-white/80 md:text-sm"
          {...props}
        />
      </div>
    </div>
  );
}
