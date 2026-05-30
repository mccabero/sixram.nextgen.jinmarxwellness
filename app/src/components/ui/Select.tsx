"use client";

import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  label: string;
  value: string;
  keywords?: string[];
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  icon?: ReactNode;
  emptyMessage?: string;
  searchPlaceholder?: string;
  placeholder?: string;
}

function normalizeSelectValue(value: unknown) {
  if (Array.isArray(value)) {
    return value[0] ? String(value[0]) : "";
  }

  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}

function createSelectChangeEvent(element: HTMLSelectElement) {
  return {
    target: element,
    currentTarget: element,
    type: "change",
    nativeEvent: new Event("change", { bubbles: true }),
    bubbles: true,
    cancelable: false,
    defaultPrevented: false,
    eventPhase: 3,
    isTrusted: false,
    preventDefault() {},
    isDefaultPrevented() {
      return false;
    },
    stopPropagation() {},
    isPropagationStopped() {
      return false;
    },
    persist() {},
    timeStamp: Date.now(),
  } as ChangeEvent<HTMLSelectElement>;
}

function createSelectBlurEvent(element: HTMLSelectElement) {
  return {
    target: element,
    currentTarget: element,
    relatedTarget: null,
    type: "blur",
    nativeEvent: new FocusEvent("blur"),
    bubbles: false,
    cancelable: false,
    defaultPrevented: false,
    eventPhase: 3,
    isTrusted: false,
    preventDefault() {},
    isDefaultPrevented() {
      return false;
    },
    stopPropagation() {},
    isPropagationStopped() {
      return false;
    },
    persist() {},
    timeStamp: Date.now(),
  } as FocusEvent<HTMLSelectElement>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      icon,
      required,
      emptyMessage = "No options found.",
      searchPlaceholder = "Search options...",
      placeholder,
      "aria-label": ariaLabel,
      id,
      name,
      disabled,
      defaultValue,
      value,
      onChange,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const fieldId = id ?? `select-${generatedId}`;
    const errorId = error ? `${fieldId}-error` : undefined;
    const helperTextId =
      !error && helperText ? `${fieldId}-helper` : undefined;
    const describedBy =
      [errorId, helperTextId].filter(Boolean).join(" ") || undefined;
    const selectRef = useRef<HTMLSelectElement | null>(null);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [uncontrolledValue, setUncontrolledValue] = useState(() =>
      normalizeSelectValue(defaultValue),
    );
    const isControlled = value !== undefined;
    const selectedValue = isControlled
      ? normalizeSelectValue(value)
      : uncontrolledValue;

    useImperativeHandle(ref, () => selectRef.current as HTMLSelectElement);

    useEffect(() => {
      if (!open) {
        setSearch("");
      }
    }, [open]);

    useLayoutEffect(() => {
      const element = selectRef.current;
      if (!element) {
        return;
      }

      const nextValue = isControlled
        ? normalizeSelectValue(value)
        : element.value;

      if (element.value !== nextValue) {
        element.value = nextValue;
      }

      if (!isControlled && uncontrolledValue !== nextValue) {
        setUncontrolledValue(nextValue);
      }
    }, [isControlled, options, uncontrolledValue, value]);

    const selectedOption = useMemo(
      () => options.find((option) => option.value === selectedValue),
      [options, selectedValue],
    );

    const filteredOptions = useMemo(() => {
      const normalizedSearch = search.trim().toLowerCase();

      if (!normalizedSearch) {
        return options;
      }

      return options.filter((option) =>
        [option.label, option.value, ...(option.keywords ?? [])].some(
          (entry) => entry.toLowerCase().includes(normalizedSearch),
        ),
      );
    }, [options, search]);

    function notifyBlur() {
      if (!selectRef.current || !onBlur) {
        return;
      }

      onBlur(createSelectBlurEvent(selectRef.current));
    }

    function handleOpenChange(nextOpen: boolean) {
      setOpen(nextOpen);

      if (!nextOpen) {
        notifyBlur();
      }
    }

    function handleSelect(nextValue: string) {
      const element = selectRef.current;
      if (!element) {
        return;
      }

      element.value = nextValue;

      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }

      onChange?.(createSelectChangeEvent(element));
      setOpen(false);
    }

    const triggerLabel =
      selectedOption?.label ??
      placeholder ??
      options[0]?.label ??
      "Select an option";

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
            <span className="pointer-events-none absolute left-4 top-1/2 z-[1] -translate-y-1/2 text-[var(--color-muted)]">
              {icon}
            </span>
          ) : null}

          <select
            ref={selectRef}
            id={fieldId}
            name={name}
            defaultValue={normalizeSelectValue(defaultValue)}
            required={required}
            disabled={disabled}
            aria-hidden="true"
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            tabIndex={-1}
            onBlur={onBlur}
            onChange={onChange}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Popover.Root open={open} onOpenChange={handleOpenChange}>
            <Popover.Trigger asChild>
              <button
                type="button"
                disabled={disabled}
                aria-label={!label ? ariaLabel : undefined}
                aria-describedby={describedBy}
                data-invalid={error ? "true" : undefined}
                className={cn(
                  "flex h-12 w-full items-center justify-between gap-3 rounded-md border border-black/10 bg-white/90 px-4 pr-3 text-left text-sm text-[var(--color-ink)] shadow-sm transition focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[rgba(212,175,55,0.18)] disabled:cursor-not-allowed disabled:opacity-60",
                  icon && "pl-11",
                  error &&
                    "border-rose-400 focus:border-rose-500 focus:ring-rose-100",
                  className,
                )}
              >
                <span
                  className={cn(
                    "truncate",
                    !selectedOption && "text-[var(--color-muted)]",
                  )}
                >
                  {triggerLabel}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="start"
                sideOffset={8}
                className="z-[60] w-[min(var(--radix-popover-trigger-width),calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-black/10 bg-[var(--color-card)] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
              >
                <Command
                  shouldFilter={false}
                  loop
                  className="overflow-hidden"
                  label={label ?? "Searchable dropdown"}
                >
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                    <Command.Input
                      value={search}
                      onValueChange={setSearch}
                      placeholder={searchPlaceholder}
                      className="h-11 w-full rounded-2xl border border-black/8 bg-black/[0.03] pl-10 pr-3 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
                    />
                  </div>
                  <Command.List className="mt-2 max-h-64 overflow-y-auto">
                    {filteredOptions.length === 0 ? (
                      <Command.Empty className="px-3 py-6 text-center text-sm text-[var(--color-muted)]">
                        {emptyMessage}
                      </Command.Empty>
                    ) : (
                      filteredOptions.map((option) => {
                        const isSelected = option.value === selectedValue;

                        return (
                          <Command.Item
                            key={option.value}
                            value={option.value}
                            keywords={option.keywords}
                            onSelect={() => handleSelect(option.value)}
                            className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none data-[selected=true]:bg-[rgba(212,175,55,0.16)]"
                          >
                            <span className="truncate">{option.label}</span>
                            <Check
                              className={cn(
                                "h-4 w-4 shrink-0 text-[var(--color-gold)]",
                                !isSelected && "opacity-0",
                              )}
                            />
                          </Command.Item>
                        );
                      })
                    )}
                  </Command.List>
                </Command>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </span>

        {error ? (
          <span id={errorId} className="text-xs text-rose-600">
            {error}
          </span>
        ) : null}
        {!error && helperText ? (
          <span id={helperTextId} className="text-xs text-[var(--color-muted)]">
            {helperText}
          </span>
        ) : null}
      </label>
    );
  },
);

Select.displayName = "Select";
