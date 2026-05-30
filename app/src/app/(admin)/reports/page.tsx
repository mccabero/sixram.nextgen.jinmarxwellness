import { ClipboardList } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      title="Reports"
      subtitle="Daily sales, payment methods, therapist totals, and completed services."
      icon={ClipboardList}
      items={["Daily sales", "Payment methods", "Therapist totals", "Services"]}
    />
  );
}
