import { redirect } from "next/navigation";
import { currentSession } from "@/server/session";
import { getProfile } from "@/server/profiles";
import { ProfileProvider } from "@/components/profile-provider";
import { AppShell } from "@/components/app-shell";
export const dynamic = "force-dynamic";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await currentSession();
  if (!session) redirect("/login");
  return (
    <ProfileProvider
      initialProfile={getProfile(session.user.id, session.user.name)}
      user={{ id: session.user.id, email: session.user.email }}
    >
      <AppShell>{children}</AppShell>
    </ProfileProvider>
  );
}
