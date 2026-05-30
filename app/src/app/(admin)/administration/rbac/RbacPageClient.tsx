/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { KeyRound, Pencil, Search, Shield, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { rbacService } from "@/services/rbacService";
import type { RoleListItem } from "@/types/rbac";

export function RbacPageClient() {
  const router = useRouter();
  const { permissions, roles: userRoles } = useAuth();
  const canManageRbac =
    userRoles.includes("Admin") || permissions.includes("rbac.manage");
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  async function loadRoles() {
    try {
      setError(null);
      setIsLoading(true);
      setRoles(await rbacService.getRoles());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load roles.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    if (!deferredSearch) {
      return roles;
    }

    return roles.filter((role) =>
      [role.name, role.description]
        .join(" ")
        .toLowerCase()
        .includes(deferredSearch),
    );
  }, [deferredSearch, roles]);

  function openRolePermissions(role: RoleListItem) {
    router.push(`/administration/rbac/${role.id}/permissions`);
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--color-ink)]">
          RBAC
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Manage role-based access by selecting a role, then assigning menu and
          action permissions.
        </p>
      </div>

      <div className="panel overflow-hidden rounded-[28px] border border-black/8">
        <div className="flex flex-col gap-4 border-b border-black/6 bg-white/55 px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Roles
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Select a role to manage its permissions.
              </p>
            </div>
          </div>

          <div className="w-full xl:max-w-sm">
            <Input
              aria-label="Search roles"
              placeholder="Search roles"
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
            Loading roles...
          </div>
        ) : null}

        {!isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead className="border-b border-black/6 bg-white/60 text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Access</th>
                  <th className="px-5 py-4 font-semibold">Users</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/6">
                {filteredRoles.map((role) => (
                  <tr
                    key={role.id}
                    className="bg-white/40 transition hover:bg-white/78"
                  >
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <button
                            type="button"
                            className="block max-w-full truncate text-left font-semibold text-[var(--color-ink)] transition hover:text-[var(--color-gold-deep)] hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
                            onClick={() => openRolePermissions(role)}
                          >
                            {role.name}
                          </button>
                          <p className="max-w-xl text-xs leading-5 text-[var(--color-muted)]">
                            {role.description || "No description provided."}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2 text-[var(--color-muted)]">
                        <KeyRound className="h-4 w-4 shrink-0" />
                        <span>{role.permissionCount} permissions</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2 text-[var(--color-muted)]">
                        <UsersRound className="h-4 w-4 shrink-0" />
                        <span>{role.userCount} users</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right align-top">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRolePermissions(role)}
                      >
                        <Pencil className="h-4 w-4" />
                        {canManageRbac ? "Manage" : "View"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && filteredRoles.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              No roles found
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
