import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
export default function Forgot() {
  return (
    <Suspense>
      <AuthForm
        mode="forgot"
        localEmail={
          process.env.AUTH_EMAIL_MODE === "local" && !process.env.SMTP_HOST
        }
      />
    </Suspense>
  );
}
