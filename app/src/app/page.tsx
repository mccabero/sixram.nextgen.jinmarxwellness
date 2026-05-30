import { redirectHomeRoute } from "@/lib/auth-server";

export default async function HomePage() {
  await redirectHomeRoute();
}
