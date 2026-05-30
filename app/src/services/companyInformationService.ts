import { apiClient } from "@/lib/api";
import type {
  BankAccount,
  CompanyAccount,
  CompanyInformation,
  UpdateCompanyInformationRequest,
} from "@/types/companyInformation";

type CompanyInformationApiResponse = CompanyInformation & {
  gCashNumbers?: CompanyAccount[];
};

function normalizeCompanyAccounts(accounts: CompanyAccount[] | undefined) {
  return (accounts ?? []).map((account) => ({
    accountName: account.accountName ?? "",
    accountNumber: account.accountNumber ?? "",
    isPrimary: Boolean(account.isPrimary),
  }));
}

function normalizeBankAccounts(accounts: BankAccount[] | undefined) {
  return (accounts ?? []).map((account) => ({
    bankProvider: account.bankProvider ?? "",
    accountName: account.accountName ?? "",
    accountNumber: account.accountNumber ?? "",
    isPrimary: Boolean(account.isPrimary),
  }));
}

function normalizeCompanyInformation(
  companyInformation: CompanyInformationApiResponse,
): CompanyInformation {
  return {
    companyName: companyInformation.companyName ?? "",
    tagline: companyInformation.tagline ?? null,
    companyAddress: companyInformation.companyAddress ?? null,
    gcashNumbers: normalizeCompanyAccounts(
      companyInformation.gcashNumbers ?? companyInformation.gCashNumbers,
    ),
    bankAccounts: normalizeBankAccounts(companyInformation.bankAccounts),
  };
}

export const companyInformationService = {
  async get() {
    const companyInformation =
      await apiClient.get<CompanyInformationApiResponse>("/api/company-information");

    return normalizeCompanyInformation(companyInformation);
  },
  async update(payload: UpdateCompanyInformationRequest) {
    const companyInformation = await apiClient.put<CompanyInformationApiResponse>(
      "/api/company-information",
      payload,
    );

    return normalizeCompanyInformation(companyInformation);
  },
};
