import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "inverse";
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-10", className)}
      aria-hidden
    >
      <path
        d="M8 32V8h11.2c5.4 0 8.8 3.1 8.8 7.6 0 3.4-1.8 5.8-4.6 6.8L28 32h-5.2l-4.4-8.4H13.2V32H8zm5.2-13.2h5.6c2.2 0 3.4-1.1 3.4-3s-1.2-3-3.4-3h-5.6v6z"
        className={variant === "inverse" ? "fill-white" : "fill-black"}
      />
    </svg>
  );
}
