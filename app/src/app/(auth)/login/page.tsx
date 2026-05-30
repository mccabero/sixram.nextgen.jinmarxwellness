import { AuthExperienceShell } from "@/components/auth/AuthExperienceShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { redirectAuthenticatedUserFromLogin } from "@/lib/auth-server";

export default async function LoginPage() {
  await redirectAuthenticatedUserFromLogin();

  return (
    <AuthExperienceShell
      cardTitle="Sign in to Jinmarx"
      cardDescription="Use your PIN or username to continue securely."
      fitViewport
    >
      <LoginForm />
    </AuthExperienceShell>
  );
}
