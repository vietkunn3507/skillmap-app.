import { currentSession } from "@/server/session";
import PhonePresentation from "@/components/phone-presentation";
export const dynamic = "force-dynamic";
export default async function Presentation() {
  const session = await currentSession();
  return (
    <PhonePresentation
      signedIn={!!session}
      demoEnabled={process.env.DEMO_ENABLED === "true"}
    />
  );
}
