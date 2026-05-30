"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-gold)] text-black shadow-[0_10px_24px_rgba(212,175,55,0.25)] hover:bg-[#c49f2f]",
  secondary: "bg-[var(--color-black)] text-white hover:bg-[#1b1b1b]",
  ghost:
    "border border-black/10 bg-white/60 text-[var(--color-ink)] hover:bg-white",
  outline:
    "border border-black/10 bg-transparent text-[var(--color-ink)] hover:bg-black/[0.03]",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      type = "button",
      loading = false,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" className="border-current border-r-transparent" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
