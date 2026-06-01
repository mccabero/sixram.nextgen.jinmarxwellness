/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  KeyRound,
  Pencil,
  Plus,
  Search,
  Shield,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { userInformationService } from "@/services/userInformationService";
import type { UserInformation } from "@/types/userInformation";
import {
  getUserFullName,
  getUserRoleLabel,
} from "./userInformationPageUtils";

function getStatusTone(user: UserInformation) {
  return user.isActive
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700";
}

function UserTypeSwitch({ isTherapist }: { isTherapist: boolean }) {
  return (
    <span
      className={`h-6 w-11 rounded-full p-1 ${
        isTherapist ? "bg-[var(--color-gold)]" : "bg-black/12"
      }`}
      aria-hidden="true"
    >
      <span
        className={`block h-4 w-4 rounded-full bg-white shadow-sm ${
          isTherapist ? "translate-x-5" : ""
        }`}
      />
    </span>
  );
}

export function UserInformationPageClient() {
  const router = useRouter();
  const { permissions, roles } = useAuth();
  const canViewUsers = roles.includes("Admin") || permissions.includes("users.view");
  const canCreateUsers =
    roles.includes("Admin") || permissions.includes("users.create");
  const [users, setUsers] = useState<UserInformation[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  async function loadUsers() {
    try {
      setError(null);
      setIsLoading(true);
      setUsers(await userInformationService.getAll());
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load users."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!deferredSearch) {
      return users;
    }

    return users.filter((user) => {
      const searchableValue = [
        getUserFullName(user),
        user.email,
        user.username,
        getUserRoleLabel(user),
        user.isTherapist ? "therapist" : "user",
      ]
        .join(" ")
        .toLowerCase();

      return searchableValue.includes(deferredSearch);
    });
  }, [deferredSearch, users]);

  function openUser(user: UserInformation) {
    router.push(`/administration/user-information/${user.id}`);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--color-ink)]">
            User Information
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Select a user from the list to manage profile details and therapist
            assignment.
          </p>
        </div>
        {canCreateUsers ? (
          <Button
            onClick={() => router.push("/administration/user-information/new")}
          >
            <Plus className="h-4 w-4" />
            Add user
          </Button>
        ) : null}
      </div>

      <div className="panel overflow-hidden rounded-[28px] border border-black/8">
        <div className="flex flex-col gap-4 border-b border-black/6 bg-white/55 px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                User list
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {canViewUsers
                  ? `${users.length} user${users.length === 1 ? "" : "s"} available`
                  : "User information access is required."}
              </p>
            </div>
          </div>

          <div className="w-full xl:max-w-sm">
            <Input
              aria-label="Search users"
              placeholder="Search users"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              icon={<Search className="h-4 w-4" />}
              className="rounded-2xl"
            />
          </div>
        </div>

        {error ? (
          <div className="m-5 rounded-[22px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--color-muted)]">
            Loading users...
          </div>
        ) : null}

        {!isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="border-b border-black/6 bg-white/60 text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                <tr>
                  <th className="px-5 py-4 font-semibold">User</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">User Type</th>
                  <th className="px-5 py-4 font-semibold">Sign-in</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/6">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="bg-white/40 transition hover:bg-white/78"
                  >
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <button
                            type="button"
                            className="block max-w-full truncate text-left font-semibold text-[var(--color-ink)] transition hover:text-[var(--color-gold-deep)] hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
                            onClick={() => openUser(user)}
                          >
                            {getUserFullName(user)}
                          </button>
                          <p className="truncate text-xs text-[var(--color-muted)]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                        <span className="truncate text-[var(--color-ink)]">
                          {getUserRoleLabel(user)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <UserTypeSwitch isTherapist={user.isTherapist} />
                        <span className="text-[var(--color-ink)]">
                          {user.isTherapist ? "Therapist" : "User"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <KeyRound className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                        <span className="rounded-full bg-[rgba(212,175,55,0.14)] px-3 py-1 text-[11px] font-semibold text-[var(--color-gold-deep)]">
                          {user.hasPinConfigured ? "PIN ready" : "Password only"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusTone(user)}`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right align-top">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && filteredUsers.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              No users found
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Try another search term.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
