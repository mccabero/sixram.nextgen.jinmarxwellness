import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AuthExperienceShellProps {
  cardBadge?: string;
  cardTitle: string;
  cardDescription: string;
  fitViewport?: boolean;
  children: ReactNode;
}

export function AuthExperienceShell({
  cardBadge,
  cardTitle,
  cardDescription,
  fitViewport = false,
  children,
}: AuthExperienceShellProps) {
  return (
    <main
      className={cn(
        "relative isolate overflow-x-hidden bg-[var(--color-black)] text-white",
        fitViewport ? "min-h-dvh lg:h-dvh lg:min-h-dvh" : "min-h-screen",
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.18)), url('/images/jinmarx-login-wallpaper.png')",
          filter: "brightness(1.16) contrast(1.08) saturate(1.08)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(0,0,0,0.06),rgba(0,0,0,0.34)_62%,rgba(0,0,0,0.64)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(246,213,130,0.82),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.54),transparent)]" />

      <div
        className={cn(
          "relative mx-auto flex w-[calc(100vw-2rem)] max-w-[540px] items-center justify-center",
          fitViewport
            ? "min-h-dvh py-6 lg:h-full lg:min-h-0"
            : "min-h-screen py-8",
        )}
      >
        <section className="w-full min-w-0">
          <div className="relative mx-auto w-full overflow-hidden rounded-[30px] border border-[rgba(246,213,130,0.28)] bg-[linear-gradient(145deg,rgba(255,255,255,0.99),rgba(246,239,226,0.96))] p-4 shadow-[0_42px_120px_rgba(0,0,0,0.56)] backdrop-blur-2xl sm:p-6">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0)_40%),radial-gradient(circle_at_50%_0%,rgba(246,213,130,0.22),transparent_44%)]" />

            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border border-[rgba(212,175,55,0.42)] bg-black shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:h-28 sm:w-28">
                  <Image
                    src="/images/jinmarx-logo.png"
                    alt="Jinmarx Wellness and Beauty Center logo"
                    fill
                    priority
                    sizes="(min-width: 640px) 112px, 96px"
                    className="object-cover"
                  />
                </div>

                {cardBadge ? (
                  <div className="mt-5 inline-flex items-center rounded-full border border-black/6 bg-white/76 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--color-gold-deep)] shadow-[0_10px_24px_rgba(24,19,11,0.08)]">
                    {cardBadge}
                  </div>
                ) : null}

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.34em] text-[var(--color-gold-deep)]">
                  Secure Access
                </p>
                <h1 className="mt-1.5 text-[1.8rem] font-semibold leading-tight text-[var(--color-ink)] sm:text-[2.1rem]">
                  {cardTitle}
                </h1>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
                  {cardDescription}
                </p>
              </div>

              <div className="mt-6">{children}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
