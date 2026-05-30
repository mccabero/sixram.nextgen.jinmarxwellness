"use client";

import {
  forwardRef,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, icon, required, ...props }, ref) => {
    return (
      <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-ink)]">
        {label ? (
          <span className="inline-flex items-center gap-1.5">
            <span>{label}</span>
            {required ? <span className="text-rose-600">*</span> : null}
          </span>
        ) : null}
        <span className="relative block">
          {icon ? (
            <span className="pointer-events-none absolute left-4 top-4 text-[var(--color-muted)]">
              {icon}
            </span>
          ) : null}
          <textarea
            ref={ref}
            className={cn(
              "min-h-28 w-full resize-y rounded-md border border-black/10 bg-white/90 px-4 py-3 text-sm text-[var(--color-ink)] shadow-sm transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[rgba(212,175,55,0.18)]",
              icon && "pl-11",
              error && "border-rose-400 focus:border-rose-500 focus:ring-rose-100",
              className,
            )}
            required={required}
            {...props}
          />
        </span>
        {error ? <span className="text-xs text-rose-600">{error}</span> : null}
        {!error && helperText ? (
          <span className="text-xs text-[var(--color-muted)]">{helperText}</span>
        ) : null}
      </label>
    );
  },
);

Textarea.displayName = "Textarea";
