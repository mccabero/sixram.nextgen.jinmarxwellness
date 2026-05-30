"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  rightAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      icon,
      rightAdornment,
      required,
      ...props
    },
    ref,
  ) => {
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
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
              {icon}
            </span>
          ) : null}
          <input
            ref={ref}
            className={cn(
              "h-12 w-full rounded-md border border-black/10 bg-white/90 px-4 text-sm text-[var(--color-ink)] shadow-sm transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[rgba(212,175,55,0.18)]",
              icon && "pl-11",
              rightAdornment && "pr-12",
              error && "border-rose-400 focus:border-rose-500 focus:ring-rose-100",
              className,
            )}
            required={required}
            {...props}
          />
          {rightAdornment ? (
            <span className="absolute right-4 top-1/2 -translate-y-1/2">
              {rightAdornment}
            </span>
          ) : null}
        </span>
        {error ? <span className="text-xs text-rose-600">{error}</span> : null}
        {!error && helperText ? (
          <span className="text-xs text-[var(--color-muted)]">{helperText}</span>
        ) : null}
      </label>
    );
  },
);

Input.displayName = "Input";
