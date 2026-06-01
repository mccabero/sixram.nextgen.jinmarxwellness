/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeInfo,
  KeyRound,
  Mail,
  Phone,
  Save,
  Shield,
  UserRound,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { userInformationService } from "@/services/userInformationService";
import type { UserInformation } from "@/types/userInformation";
import {
  emptyUserInformationFormValues,
  createUserInformationSchema,
  getUserFullName,
  primaryRoleOptions,
  toCreateRequest,
  toFormValues,
  toRequest,
  userInformationSchema,
  type UserInformationFormValues,
} from "../userInformationPageUtils";

const userInformationListPath = "/administration/user-information";

type ManageUserPageClientProps = {
  userId?: string;
};

export function ManageUserPageClient({ userId }: ManageUserPageClientProps) {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const routeUserId = userId ?? params.id;
  const isEditMode = Boolean(routeUserId);
  const { permissions, roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const canCreate = isAdmin || permissions.includes("users.create");
  const canUpdate = isAdmin || permissions.includes("users.update");
  const canSave = isEditMode ? canUpdate : canCreate;
  const [user, setUser] = useState<UserInformation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<UserInformationFormValues>({
    resolver: zodResolver(
      isEditMode ? userInformationSchema : createUserInformationSchema,
    ),
    defaultValues: emptyUserInformationFormValues,
  });

  const loadUser = useCallback(async () => {
    try {
      setError(null);
      setNotFound(false);
      setIsLoading(true);

      if (!routeUserId) {
        setUser(null);
        reset(emptyUserInformationFormValues);
        return;
      }

      const response = await userInformationService.getById(routeUserId);
      setUser(response);
      reset(toFormValues(response));
    } catch (loadError) {
      const message = getErrorMessage(loadError, "Unable to load user.");
      setError(message);
      setNotFound(message.toLowerCase().includes("not found"));
    } finally {
      setIsLoading(false);
    }
  }, [reset, routeUserId]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  async function submit(values: UserInformationFormValues) {
    if (isEditMode && !user) {
      return;
    }

    if (!canSave) {
      setError(
        isEditMode
          ? "You do not have permission to update user information."
          : "You do not have permission to create users.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (user) {
        await userInformationService.update(user.id, toRequest(values));
        router.replace(userInformationListPath);
        return;
      }

      await userInformationService.create(toCreateRequest(values));
      router.replace(userInformationListPath);
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Please review the form and try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isLoading && notFound) {
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
          onClick={() => router.push(userInformationListPath)}
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
            {isEditMode ? "Manage User" : "Add User"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            {isEditMode
              ? "Update the selected user profile and therapist assignment."
              : "Create a user account with role access and sign-in credentials."}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push(userInformationListPath)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Button>
      </div>

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="panel rounded-[28px] border border-black/8 p-6 text-sm text-[var(--color-muted)]">
          Loading user...
        </div>
      ) : null}

      {!isLoading && (user || !isEditMode) ? (
        <div className="panel space-y-6 rounded-[28px] border border-black/8 p-5">
          <div className="flex items-start gap-4 rounded-[24px] border border-[rgba(212,175,55,0.24)] bg-[linear-gradient(135deg,rgba(247,231,206,0.7),rgba(255,255,255,0.95))] p-5">
            <div className="rounded-2xl bg-[var(--color-black)] p-3 text-[var(--color-gold)]">
              <BadgeInfo className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Account: {user ? getUserFullName(user) : "New user"}
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {canSave
                  ? isEditMode
                    ? "Profile edits are saved to the user account record."
                    : "Create a user with a temporary password and optional PIN."
                  : isEditMode
                    ? "You can review this page, but saving changes requires user update access."
                    : "Creating users requires user create access."}
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(submit)}>
            <div className="grid gap-5 lg:grid-cols-2">
              <Input
                label="First name"
                required
                error={errors.firstName?.message}
                disabled={!canSave || isSubmitting}
                {...register("firstName")}
              />
              <Input
                label="Last name"
                required
                error={errors.lastName?.message}
                disabled={!canSave || isSubmitting}
                {...register("lastName")}
              />
              <Input
                label="Email address"
                required
                type="email"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                disabled={!canSave || isSubmitting}
                {...register("email")}
              />
              <Input
                label="Phone number"
                icon={<Phone className="h-4 w-4" />}
                error={errors.phoneNumber?.message}
                disabled={!canSave || isSubmitting}
                {...register("phoneNumber")}
              />
              <Input
                label="Username"
                required
                icon={<UserRound className="h-4 w-4" />}
                error={errors.username?.message}
                disabled={!canSave || isSubmitting}
                {...register("username")}
              />
              <Select
                label="Primary role"
                required
                icon={<Shield className="h-4 w-4" />}
                error={errors.role?.message}
                disabled={!canSave || isSubmitting}
                options={primaryRoleOptions}
                searchPlaceholder="Search roles..."
                emptyMessage="No roles found."
                {...register("role")}
              />

              {!isEditMode ? (
                <>
                  <Input
                    label="Temporary password"
                    required
                    type="password"
                    autoComplete="new-password"
                    icon={<KeyRound className="h-4 w-4" />}
                    error={errors.password?.message}
                    disabled={!canSave || isSubmitting}
                    helperText="At least 8 characters with uppercase, lowercase, and a number."
                    {...register("password")}
                  />
                  <Input
                    label="PIN"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="off"
                    icon={<KeyRound className="h-4 w-4" />}
                    error={errors.pin?.message}
                    disabled={!canSave || isSubmitting}
                    helperText="Optional 6-digit PIN for quick sign-in."
                    {...register("pin")}
                  />
                </>
              ) : null}

              <Controller
                control={control}
                name="isTherapist"
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-4 rounded-[22px] border border-black/8 bg-white/72 p-4">
                    <span className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[var(--color-ink)]">
                          Therapist access
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">
                          Makes this user assignable for therapist workflows.
                        </span>
                      </span>
                    </span>
                    <Switch
                      checked={field.value}
                      disabled={!canSave || isSubmitting}
                      aria-label="Therapist access"
                      onBlur={field.onBlur}
                      onCheckedChange={field.onChange}
                    />
                  </label>
                )}
              />

              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-4 rounded-[22px] border border-black/8 bg-white/72 p-4">
                    <span className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]">
                        <BadgeInfo className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[var(--color-ink)]">
                          Active account
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">
                          Allows this user to sign in and use assigned access.
                        </span>
                      </span>
                    </span>
                    <Switch
                      checked={field.value}
                      disabled={!canSave || isSubmitting}
                      aria-label="Active account"
                      onBlur={field.onBlur}
                      onCheckedChange={field.onChange}
                    />
                  </label>
                )}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-black/6 pt-5 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                type="button"
                onClick={() => router.push(userInformationListPath)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {canSave ? (
                <Button type="submit" loading={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {isEditMode ? "Save changes" : "Create user"}
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
