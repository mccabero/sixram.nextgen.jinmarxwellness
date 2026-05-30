import { CalendarDays } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function OperationsAppointmentsPage() {
  return (
    <ModulePlaceholder
      title="Appointments"
      subtitle="Massage bookings with customer, therapist, service, and status."
      icon={CalendarDays}
      items={["Booked", "Checked in", "Completed", "Cancelled"]}
    />
  );
}
