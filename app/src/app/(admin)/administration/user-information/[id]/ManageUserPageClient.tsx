"use client";

import { ArrowLeft, BadgeInfo, Mail, Phone, UserRound } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  getUserById,
  getUserFullName,
} from "../userInformationData";

export function ManageUserPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = getUserById(params.id);

  if (!user) {
    return (
      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--color-ink)]">
            User not found
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            The selected user record is not available.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push("/administration/user-information")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--color-ink)]">
            Manage User
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Update the selected user profile and therapist assignment.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push("/administration/user-information")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Button>
      </div>

      <div className="panel space-y-6 rounded-[28px] border border-black/8 p-5">
        <div className="flex items-start gap-4 rounded-[24px] border border-[rgba(212,175,55,0.24)] bg-[linear-gradient(135deg,rgba(247,231,206,0.7),rgba(255,255,255,0.95))] p-5">
          <div className="rounded-2xl bg-[var(--color-black)] p-3 text-[var(--color-gold)]">
            <BadgeInfo className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              Account: {getUserFullName(user)}
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              This dedicated page follows the GoldSuite edit-user pattern after
              selecting a record from the list.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Input label="First name" defaultValue={user.firstName} />
          <Input label="Last name" defaultValue={user.lastName} />
          <Input
            label="Email address"
            defaultValue={user.email}
            icon={<Mail className="h-4 w-4" />}
          />
          <Input
            label="Phone number"
            defaultValue={user.phone}
            icon={<Phone className="h-4 w-4" />}
          />
          <Input label="Username" defaultValue={user.username} />
          <Input label="Role" defaultValue={user.role} />

          <label className="flex items-center justify-between gap-4 rounded-[22px] border border-black/8 bg-white/72 p-4 lg:col-span-2">
            <span className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]">
                <UserRound className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--color-ink)]">
                  Therapist access
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">
                  Turn on when this user should appear as an assignable
                  therapist in appointments and POS.
                </span>
              </span>
            </span>
            <input
              type="checkbox"
              className="peer sr-only"
              defaultChecked={user.isTherapist}
            />
            <span className="relative h-7 w-12 shrink-0 rounded-full bg-black/12 transition peer-checked:bg-[var(--color-gold)] peer-checked:[&>span]:translate-x-5">
              <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition" />
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-black/6 pt-5 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => router.push("/administration/user-information")}
          >
            Cancel
          </Button>
          <Button onClick={() => router.push("/administration/user-information")}>
            Save changes
          </Button>
        </div>
      </div>
    </section>
  );
}
