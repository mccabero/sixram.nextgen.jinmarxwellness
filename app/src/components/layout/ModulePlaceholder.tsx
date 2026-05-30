import type { LucideIcon } from "lucide-react";

interface ModulePlaceholderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  items: string[];
}

export function ModulePlaceholder({
  title,
  subtitle,
  icon: Icon,
  items,
}: ModulePlaceholderProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
            Jinmarx Wellness
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--color-ink)]">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="panel overflow-hidden rounded-[28px] border border-black/8">
        <div className="flex items-center gap-4 border-b border-black/6 bg-white/55 px-5 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              Module baseline
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Ready for the first implementation pass.
            </p>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <article
              key={item}
              className="min-h-[116px] rounded-[22px] border border-black/8 bg-white/75 p-4 shadow-[0_14px_30px_rgba(17,12,7,0.06)]"
            >
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {item}
              </p>
              <div className="mt-5 flex items-center gap-1.5">
                <span className="h-1.5 w-10 rounded-full bg-[var(--color-gold)]" />
                <span className="h-1.5 w-5 rounded-full bg-black/8" />
                <span className="h-1.5 w-3 rounded-full bg-black/8" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
