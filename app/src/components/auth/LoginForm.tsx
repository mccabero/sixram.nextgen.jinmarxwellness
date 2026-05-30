"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, LockKeyhole, UserRound } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { PinCodeInput } from "@/components/auth/PinCodeInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const loginSchema = z
  .object({
    loginMode: z.enum(["pin", "password"]),
    pin: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.loginMode === "password") {
      if (!value.username || value.username.trim().length === 0) {
        context.addIssue({
          code: "custom",
          path: ["username"],
          message: "Username is required.",
        });
      }

      if (!value.password || value.password.trim().length === 0) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Password is required.",
        });
      }
    }

    if (value.loginMode === "pin" && !/^\d{6}$/.test(value.pin ?? "")) {
      context.addIssue({
        code: "custom",
        path: ["pin"],
        message: "Enter your 6-digit PIN.",
      });
    }
  });

type LoginFormValues = z.infer<typeof loginSchema>;

const loginOptions = [
  {
    value: "pin",
    label: "PIN Login",
    description: "Use your 6-digit quick sign-in PIN.",
    icon: KeyRound,
  },
  {
    value: "password",
    label: "Username Login",
    description: "Use your username and password.",
    icon: LockKeyhole,
  },
] as const;

export function LoginForm() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginMode: "pin",
      pin: "",
      username: "",
      password: "",
    },
  });

  const loginMode = useWatch({
    control,
    name: "loginMode",
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  async function onSubmit(values: LoginFormValues) {
    try {
      setError(null);

      await login(
        values.loginMode === "pin"
          ? {
              loginMode: "pin",
              pin: values.pin,
            }
          : {
              loginMode: "password",
              username: values.username,
              password: values.password,
            },
      );

      router.push("/dashboard");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in right now.",
      );
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" {...register("loginMode")} />

      <div className="rounded-[24px] border border-[#e7ddd0] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,243,238,0.94))] p-2 shadow-[0_18px_40px_rgba(11,11,11,0.08)]">
        <div className="grid gap-2 md:grid-cols-2">
          {loginOptions.map((option) => {
            const Icon = option.icon;
            const isActive = loginMode === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue("loginMode", option.value)}
                className={cn(
                  "min-h-[68px] rounded-[19px] border px-3 py-2.5 text-left transition duration-200",
                  isActive
                    ? "border-[rgba(212,175,55,0.42)] bg-[linear-gradient(135deg,rgba(250,240,220,0.92),rgba(255,255,255,0.98))] shadow-[0_14px_26px_rgba(212,175,55,0.14)]"
                    : "border-[#e7ddd0] bg-white/55 hover:border-black/8 hover:bg-white/72",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "rounded-2xl p-2.5",
                      isActive
                        ? "bg-[var(--color-black)] text-[var(--color-gold)]"
                        : "bg-black/[0.04] text-[var(--color-muted)]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {option.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {loginMode === "pin" ? (
        <div className="rounded-[24px] border border-[rgba(212,175,55,0.16)] bg-[linear-gradient(180deg,rgba(249,242,229,0.82),rgba(255,255,255,0.98))] p-3.5 shadow-[0_20px_48px_rgba(11,11,11,0.08)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--color-black)] p-2.5 text-[var(--color-gold)]">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                6-digit PIN
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                Enter your secure Jinmarx quick sign-in PIN.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Controller
              control={control}
              name="pin"
              render={({ field }) => (
                <PinCodeInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  autoFocus
                  error={errors.pin?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-black/8 bg-[linear-gradient(180deg,rgba(247,231,206,0.18),rgba(255,255,255,0.98))] p-3.5 shadow-[0_20px_48px_rgba(11,11,11,0.08)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--color-black)] p-2.5 text-[var(--color-gold)]">
              <LockKeyhole className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Username and password
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                Use your full account credentials.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Input
              label="Username"
              placeholder="owner@jinmarx.local"
              autoFocus
              className="h-[50px] rounded-2xl border-[#e4dbcf] bg-white/94 shadow-[0_12px_28px_rgba(11,11,11,0.05)]"
              icon={<UserRound className="h-4 w-4 text-[var(--color-black)]" />}
              error={errors.username?.message}
              {...register("username")}
            />
          </div>

          <div className="mt-4">
            <Input
              label="Password"
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              className="h-[50px] rounded-2xl border-[#e4dbcf] bg-white/94 shadow-[0_12px_28px_rgba(11,11,11,0.05)]"
              icon={<LockKeyhole className="h-4 w-4" />}
              error={errors.password?.message}
              rightAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="rounded-full p-1 text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              {...register("password")}
            />
          </div>
        </div>
      )}

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50/92 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : null}

      <Button
        className="h-[52px] w-full rounded-full bg-[linear-gradient(135deg,#d4af37,#f0cd66)] text-[15px] text-black shadow-[0_20px_38px_rgba(212,175,55,0.3)] hover:bg-[linear-gradient(135deg,#caa332,#e7c35f)]"
        type="submit"
        disabled={isSubmitting}
        loading={isSubmitting}
      >
        {loginMode === "pin" ? "Sign in with PIN" : "Sign in with password"}
      </Button>

      <p className="text-center text-xs leading-6 text-[var(--color-muted)]">
        Private access for authorized Jinmarx Wellness personnel only.
      </p>
    </form>
  );
}
