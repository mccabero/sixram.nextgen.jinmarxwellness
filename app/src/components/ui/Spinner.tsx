import { cn } from "@/lib/utils";

export function Spinner({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-r-transparent",
        size === "sm" ? "h-4 w-4" : "h-5 w-5",
        className,
      )}
      aria-hidden="true"
    />
  );
}
