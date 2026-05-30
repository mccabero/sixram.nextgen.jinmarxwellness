"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface PinCodeInputProps {
  value: string;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
}

export function PinCodeInput({
  value,
  length = 6,
  autoFocus = false,
  disabled,
  error,
  onChange,
}: PinCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(
    () => Array.from({ length }, (_, index) => value[index] ?? ""),
    [length, value],
  );

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  useEffect(() => {
    if (!autoFocus || disabled) {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [autoFocus, disabled]);

  function focusInput(index: number) {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  }

  function updateDigit(index: number, nextDigit: string) {
    const nextDigits = [...digits];
    nextDigits[index] = nextDigit;
    onChange(nextDigits.join(""));
  }

  function handleChange(index: number, rawValue: string) {
    const nextValue = rawValue.replace(/\D/g, "");

    if (!nextValue) {
      updateDigit(index, "");
      return;
    }

    if (nextValue.length > 1) {
      const nextDigits = [...digits];
      nextValue
        .slice(0, length)
        .split("")
        .forEach((digit, offset) => {
          const targetIndex = index + offset;
          if (targetIndex < length) {
            nextDigits[targetIndex] = digit;
          }
        });

      onChange(nextDigits.join(""));
      focusInput(Math.min(index + nextValue.length, length - 1));
      return;
    }

    updateDigit(index, nextValue);

    if (index < length - 1) {
      focusInput(index + 1);
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pasted) {
      return;
    }

    onChange(pasted);
    focusInput(Math.min(pasted.length - 1, length - 1));
  }

  return (
    <div className="space-y-2">
      <div
        style={{
          display: "grid",
          gap: "clamp(0.35rem, 1.8vw, 0.875rem)",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        }}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="password"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`PIN digit ${index + 1}`}
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            className={cn(
              "rounded-2xl border border-[#e5dccf] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,241,232,0.92))] text-center text-lg font-semibold tracking-[0.18em] text-[var(--color-ink)] shadow-[0_12px_24px_rgba(11,11,11,0.06)] transition focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[rgba(212,175,55,0.18)] sm:text-xl sm:tracking-[0.24em]",
              error && "border-rose-400 focus:border-rose-500 focus:ring-rose-100",
            )}
            style={{
              height: "clamp(2.5rem, 11vw, 3.75rem)",
              minWidth: 0,
              width: "100%",
            }}
          />
        ))}
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
