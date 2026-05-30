import { APP_VERSION } from "@/generated/appVersion";
import { cn } from "@/lib/utils";

interface AppFooterProps {
  className?: string;
  companyName: string;
}

export function AppFooter({ className, companyName }: AppFooterProps) {
  return (
    <footer
      className={cn(
        "mt-8 flex w-full flex-col gap-2 border-t border-black/6 pt-5 text-xs text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span>{companyName}</span>
        <span>&copy; 2026 Sixram Technologies. All rights reserved.</span>
      </p>
      <p>{APP_VERSION}</p>
    </footer>
  );
}
