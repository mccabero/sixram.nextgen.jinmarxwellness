/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { CompanyInformationForm } from "@/components/forms/CompanyInformationForm";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { companyInformationService } from "@/services/companyInformationService";
import type {
  CompanyInformation,
  UpdateCompanyInformationRequest,
} from "@/types/companyInformation";

const formId = "company-information-form";

export function CompanyInformationPageClient() {
  const router = useRouter();
  const { permissions, roles } = useAuth();
  const canUpdate =
    roles.includes("Admin") || permissions.includes("company_information.update");
  const [companyInformation, setCompanyInformation] =
    useState<CompanyInformation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadCompanyInformation() {
    try {
      setError(null);
      setSuccessMessage(null);
      setIsLoading(true);
      setCompanyInformation(await companyInformationService.get());
    } catch (loadError) {
      setError(
        getErrorMessage(loadError, "Unable to load company information."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCompanyInformation();
  }, []);

  async function handleUpdate(payload: UpdateCompanyInformationRequest) {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      const response = await companyInformationService.update(payload);
      setCompanyInformation(response);
      setSuccessMessage("Company information was saved successfully.");
    } catch (updateError) {
      setError(
        getErrorMessage(updateError, "Please review the form and try again."),
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
            Company Information
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Maintain the company profile and preferred collection accounts used
            across Jinmarx Wellness operations.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void loadCompanyInformation()}
          disabled={isLoading || isSubmitting}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {successMessage ? (
        <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="panel rounded-[28px] border border-black/8 p-6 text-sm text-[var(--color-muted)]">
          Loading company information...
        </div>
      ) : null}

      {!isLoading && companyInformation ? (
        <div className="panel overflow-hidden rounded-[28px] border border-black/8">
          <div className="flex items-start gap-4 border-b border-black/6 bg-white/55 px-5 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Business profile and collection account setup
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                Manage the core company identity plus the GCash and bank
                accounts your team should reference going forward.
              </p>
            </div>
          </div>

          <div className="p-5">
            <CompanyInformationForm
              formId={formId}
              value={companyInformation}
              canUpdate={canUpdate}
              isSubmitting={isSubmitting}
              cancelLabel="Cancel"
              onCancel={() => router.push("/dashboard")}
              onSubmit={handleUpdate}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
