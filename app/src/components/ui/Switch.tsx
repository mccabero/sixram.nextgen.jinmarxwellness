"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Switch = forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-black/12 transition data-[state=checked]:bg-[var(--color-gold)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 translate-x-1 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-6" />
    </SwitchPrimitive.Root>
  );
});

Switch.displayName = SwitchPrimitive.Root.displayName;
