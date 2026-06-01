import { ManageBookingPageClient } from "../ManageBookingPageClient";

type AddBookingPageProps = {
  searchParams?: Promise<{
    appointmentId?: string;
    source?: string;
  }>;
};

export default async function AddBookingPage({
  searchParams,
}: AddBookingPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <ManageBookingPageClient
      initialAppointmentId={resolvedSearchParams?.appointmentId}
      initialSource={
        resolvedSearchParams?.source === "Appointment"
          ? "Appointment"
          : undefined
      }
    />
  );
}
