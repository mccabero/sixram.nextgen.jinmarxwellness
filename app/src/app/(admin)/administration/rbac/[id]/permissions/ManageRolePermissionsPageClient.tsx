/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, RotateCcw, Save, Search, Shield } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { rbacService } from "@/services/rbacService";
import type { Permission, PermissionGroup, RolePermissionEditor } from "@/types/rbac";

type PermissionFilter = "all" | "selected" | "changed";

const rbacListPath = "/administration/rbac";

const actionOrder: Record<string, number> = {
  view: 1,
  create: 2,
  manage: 3,
  update: 4,
  delete: 5,
};

function getPermissionAction(permission: Permission) {
  return permission.code.split(".")[1] ?? "view";
}

function sortPermissions(permissions: Permission[]) {
  return [...permissions].sort((left, right) => {
    const leftRank = actionOrder[getPermissionAction(left)] ?? 50;
    const rightRank = actionOrder[getPermissionAction(right)] ?? 50;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.code.localeCompare(right.code);
  });
}

function getActionLabel(permission: Permission) {
  const action = getPermissionAction(permission);
  return action.charAt(0).toUpperCase() + action.slice(1).replaceAll("_", " ");
}

function ToggleSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-3">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full bg-black/12 transition peer-checked:bg-[var(--color-gold)] peer-checked:[&>span]:translate-x-5",
          disabled && "opacity-60",
        )}
      >
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition" />
      </span>
    </label>
  );
}

export function ManageRolePermissionsPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { permissions, roles } = useAuth();
  const roleId = params.id;
  const canManageRbac = roles.includes("Admin") || permissions.includes("rbac.manage");
  const [editor, setEditor] = useState<RolePermissionEditor | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [initialCodes, setInitialCodes] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PermissionFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEditor = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await rbacService.getRolePermissionEditor(roleId);
      setEditor(response);
      setSelectedCodes(response.selectedPermissionCodes);
      setInitialCodes(response.selectedPermissionCodes);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load role permissions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    void loadEditor();
  }, [loadEditor]);

  const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);
  const initialSet = useMemo(() => new Set(initialCodes), [initialCodes]);
  const changedCount = useMemo(() => {
    const allCodes = new Set([...selectedCodes, ...initialCodes]);
    return [...allCodes].filter(
      (code) => selectedSet.has(code) !== initialSet.has(code),
    ).length;
  }, [initialCodes, initialSet, selectedCodes, selectedSet]);
  const isDirty = changedCount > 0;
  const normalizedSearch = search.trim().toLowerCase();

  const permissionGroups = useMemo(() => {
    if (!editor) {
      return [];
    }

    return editor.permissionGroups
      .map((group) => {
        const permissions = sortPermissions(group.permissions).filter((permission) => {
          const isSelected = selectedSet.has(permission.code);
          const isChanged = isSelected !== initialSet.has(permission.code);
          const matchesSearch = [group.module, permission.name, permission.code, permission.description]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);

          if (!matchesSearch) {
            return false;
          }

          if (filter === "selected") {
            return isSelected;
          }

          if (filter === "changed") {
            return isChanged;
          }

          return true;
        });

        return {
          ...group,
          permissions,
        };
      })
      .filter((group) => group.permissions.length > 0);
  }, [editor, filter, initialSet, normalizedSearch, selectedSet]);

  function setPermission(permissionCode: string, checked: boolean) {
    if (!canManageRbac) {
      return;
    }

    setSelectedCodes((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(permissionCode);
      } else {
        next.delete(permissionCode);
      }

      return [...next].sort();
    });
  }

  function setGroup(group: PermissionGroup, enabled: boolean) {
    if (!canManageRbac) {
      return;
    }

    setSelectedCodes((current) => {
      const next = new Set(current);
      group.permissions.forEach((permission) => {
        if (enabled) {
          next.add(permission.code);
        } else {
          next.delete(permission.code);
        }
      });

      return [...next].sort();
    });
  }

  async function saveChanges() {
    if (!canManageRbac) {
      setError("You do not have permission to manage RBAC.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await rbacService.updateRolePermissions(roleId, {
        permissionCodes: selectedCodes,
      });
      router.replace(rbacListPath);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save role permissions.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--color-ink)]">
            Manage Role Permissions
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Assign menu and action permissions to the selected role.
          </p>
          {!canManageRbac ? (
            <p className="mt-2 text-sm font-medium text-[var(--color-muted)]">
              You can review permissions, but saving changes requires RBAC
              management access.
            </p>
          ) : null}
        </div>
        <Button variant="ghost" onClick={() => router.push(rbacListPath)}>
          <ArrowLeft className="h-4 w-4" />
          Back to roles
        </Button>
      </div>

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="panel rounded-[28px] border border-black/8 p-6 text-sm text-[var(--color-muted)]">
          Loading role permissions...
        </div>
      ) : null}

      {!isLoading && editor ? (
        <>
          <div className="panel space-y-5 rounded-[28px] border border-black/8 p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="rounded-2xl bg-[var(--color-black)] p-3 text-[var(--color-gold)]">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                    {editor.role.name}
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
                    {editor.role.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[420px]">
                <MetricTile label="Enabled" value={selectedCodes.length} />
                <MetricTile
                  label="Available"
                  value={editor.permissionGroups.reduce(
                    (total, group) => total + group.permissions.length,
                    0,
                  )}
                />
                <MetricTile label="Changed" value={changedCount} warning={isDirty} />
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_auto] xl:items-end">
              <Input
                label="Search permissions"
                placeholder="Search menu, action, or permission code"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                icon={<Search className="h-4 w-4" />}
              />

              <div className="flex flex-wrap gap-2">
                {(["all", "selected", "changed"] satisfies PermissionFilter[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={filter === mode ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setFilter(mode)}
                  >
                    {mode === "all"
                      ? "All"
                      : mode === "selected"
                        ? "Selected"
                        : "Changed"}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {permissionGroups.map((group) => {
              const groupEnabledCount = group.permissions.filter((permission) =>
                selectedSet.has(permission.code),
              ).length;
              const allGroupVisiblePermissionsEnabled =
                group.permissions.length > 0 &&
                groupEnabledCount === group.permissions.length;

              return (
                <section
                  key={group.module}
                  className="panel overflow-hidden rounded-[28px] border border-black/8"
                >
                  <div className="flex flex-col gap-4 border-b border-black/6 bg-white/55 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                        {group.module}
                      </h2>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {groupEnabledCount}/{group.permissions.length} visible
                        permissions enabled
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={allGroupVisiblePermissionsEnabled ? "secondary" : "outline"}
                        size="sm"
                        disabled={!canManageRbac || isSubmitting}
                        onClick={() => setGroup(group, true)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Enable all
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canManageRbac || isSubmitting}
                        onClick={() => setGroup(group, false)}
                      >
                        Disable all
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 p-5 lg:grid-cols-2">
                    {group.permissions.map((permission) => {
                      const isSelected = selectedSet.has(permission.code);
                      const isChanged = isSelected !== initialSet.has(permission.code);

                      return (
                        <article
                          key={permission.code}
                          className={cn(
                            "rounded-[22px] border bg-white/76 p-4 transition",
                            isSelected
                              ? "border-[rgba(212,175,55,0.42)]"
                              : "border-black/8",
                            isChanged && "ring-2 ring-amber-200",
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-[var(--color-ink)]">
                                  {permission.name}
                                </p>
                                <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-muted)]">
                                  {getActionLabel(permission)}
                                </span>
                                {isChanged ? (
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                                    Changed
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                                {permission.description}
                              </p>
                              <p className="mt-3 font-mono text-[11px] text-[var(--color-muted)]">
                                {permission.code}
                              </p>
                            </div>
                            <ToggleSwitch
                              checked={isSelected}
                              disabled={!canManageRbac || isSubmitting}
                              label={`${permission.name} permission`}
                              onChange={(checked) =>
                                setPermission(permission.code, checked)
                              }
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {permissionGroups.length === 0 ? (
            <div className="panel rounded-[28px] border border-black/8 px-5 py-12 text-center">
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                No permissions match the current filters.
              </p>
              <Button
                variant="ghost"
                className="mt-4"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : null}

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-[24px] border border-black/10 bg-white/95 p-4 shadow-[0_18px_45px_rgba(17,12,7,0.12)] backdrop-blur md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
              <KeyRound className="h-4 w-4 text-[var(--color-gold-deep)]" />
              <span>
                {isDirty
                  ? `${changedCount} permission change${changedCount === 1 ? "" : "s"} pending`
                  : "No pending permission changes"}
              </span>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => router.push(rbacListPath)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                disabled={!canManageRbac || !isDirty || isSubmitting}
                onClick={() => setSelectedCodes(initialCodes)}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                loading={isSubmitting}
                disabled={!canManageRbac || !isDirty}
                onClick={() => void saveChanges()}
              >
                <Save className="h-4 w-4" />
                Save changes
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function MetricTile({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: number;
  warning?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        warning
          ? "border-amber-100 bg-amber-50 text-amber-800"
          : "border-black/10 bg-white text-[var(--color-ink)]",
      )}
    >
      <p className="text-xs font-semibold uppercase text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
