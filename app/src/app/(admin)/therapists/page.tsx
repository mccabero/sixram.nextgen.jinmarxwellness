import { redirect } from "next/navigation";

export default function LegacyStaffRedirectPage() {
  redirect("/administration/user-information");
}
