import Link from "next/link";
import {
  CalendarDays,
  CircleDollarSign,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { requireServerSession } from "@/lib/auth-server";
import { formatCurrency } from "@/lib/utils";

const snapshotCards = [
  {
    label: "Today's Sales",
    value: formatCurrency(0),
    helper: "No completed sales yet",
    icon: CircleDollarSign,
    tone: "text-emerald-700 bg-emerald-50",
  },
  {
    label: "Appointments",
    value: "0",
    helper: "No bookings today",
    icon: CalendarDays,
    tone: "text-sky-700 bg-sky-50",
  },
  {
    label: "Active Therapists",
    value: "0",
    helper: "Tag users as therapists",
    icon: UserRound,
    tone: "text-[var(--color-gold-deep)] bg-[rgba(212,175,55,0.14)]",
  },
  {
    label: "Massage Services",
    value: "0",
    helper: "Set up service prices",
    icon: Sparkles,
    tone: "text-[var(--color-sage)] bg-[var(--color-sage-soft)]",
  },
];

const quickActions = [
  {
    href: "/operations/pos",
    label: "New Sale",
    description: "Start checkout",
    icon: ReceiptText,
  },
  {
    href: "/operations/appointments",
    label: "New Appointment",
    description: "Book a massage",
    icon: CalendarDays,
  },
  {
    href: "/configuration/service-offered",
    label: "Service Offered",
    description: "Manage prices",
    icon: Sparkles,
  },
  {
    href: "/customers",
    label: "Customers",
    description: "Open client list",
    icon: UsersRound,
  },
];

export default async function DashboardPage() {
  const user = await requireServerSession();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
            Welcome back, {user.firstName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--color-ink)]">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            A compact view for daily massage center sales, appointments, and
            front desk actions.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(212,175,55,0.24)] bg-white/72 px-4 py-2 text-xs font-semibold text-[var(--color-gold-deep)] shadow-sm">
          <ShieldCheck className="h-4 w-4" />
          Baseline workspace
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {snapshotCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="relative flex min-h-[154px] flex-col justify-between overflow-hidden rounded-[26px] border border-black/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,255,255,0.82))] p-5 shadow-[0_18px_38px_rgba(17,12,7,0.08)]"
            >
              <span className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#d4af37,#8f6a1c)]" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    {card.label}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {card.helper}
                  </p>
                </div>
                <span
                  className={`relative rounded-2xl p-2.5 shadow-[0_10px_22px_rgba(17,12,7,0.08)] ${card.tone}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 break-words text-3xl font-semibold leading-tight text-[var(--color-ink)]">
                {card.value}
              </p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)]">
        <section className="panel overflow-hidden rounded-[28px] border border-black/8">
          <div className="border-b border-black/6 bg-white/55 px-5 py-5">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              Quick Actions
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Primary daily paths for a small massage center.
            </p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex min-h-[118px] items-start gap-4 rounded-[22px] border border-black/8 bg-white/72 p-4 shadow-[0_14px_30px_rgba(17,12,7,0.06)] transition hover:-translate-y-0.5 hover:border-[rgba(212,175,55,0.36)] hover:bg-white"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[var(--color-black)] text-[var(--color-gold)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--color-ink)]">
                      {action.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">
                      {action.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="panel rounded-[28px] border border-black/8 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-sage-soft)] text-[var(--color-sage)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[var(--color-ink)]">
            First POS milestone
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-muted)]">
            <p>
              Services, user therapist tags, customers, appointments, and
              checkout.
            </p>
            <p>Reports begin with today&apos;s sales and payment method totals.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
