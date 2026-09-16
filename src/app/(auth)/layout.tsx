import { redirect } from "next/navigation";
import { currentSession } from "@/server/session";
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await currentSession()) redirect("/dashboard");
  return <>{children}</>;
}
