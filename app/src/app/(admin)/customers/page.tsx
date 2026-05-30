import { UsersRound } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function CustomersPage() {
  return (
    <ModulePlaceholder
      title="Customers"
      subtitle="Simple client records for name, phone, notes, and visit history."
      icon={UsersRound}
      items={["Name", "Phone", "Notes", "Visit history"]}
    />
  );
}
