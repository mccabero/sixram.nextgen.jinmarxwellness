export interface CompanyAccount {
  accountName: string;
  accountNumber: string;
  isPrimary: boolean;
}

export interface BankAccount {
  bankProvider: string;
  accountName: string;
  accountNumber: string;
  isPrimary: boolean;
}

export interface CompanyInformation {
  companyName: string;
  tagline?: string | null;
  companyAddress?: string | null;
  gcashNumbers: CompanyAccount[];
  bankAccounts: BankAccount[];
}

export interface UpdateCompanyInformationRequest {
  companyName: string;
  tagline?: string | null;
  companyAddress?: string | null;
  gcashNumbers: CompanyAccount[];
  bankAccounts: BankAccount[];
}
