import { ManageAppointmentPageClient } from "../ManageAppointmentPageClient";

type AddAppointmentPageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

export default async function AddAppointmentPage({
  searchParams,
}: AddAppointmentPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <ManageAppointmentPageClient initialDate={resolvedSearchParams?.date} />
  );
}
