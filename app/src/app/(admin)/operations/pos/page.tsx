import { ReceiptText } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function OperationsPosPage() {
  return (
    <ModulePlaceholder
      title="POS Checkout"
      subtitle="Front desk checkout for walk-in and appointment-based massage services."
      icon={ReceiptText}
      items={[
        "Select service",
        "Assign therapist",
        "Apply discount",
        "Record payment",
      ]}
    />
  );
}
