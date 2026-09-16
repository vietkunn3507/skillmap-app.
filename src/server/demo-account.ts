import { auth } from "./auth.ts";
import { db } from "./db.ts";
import { saveProfile } from "./profiles.ts";
import { demoProfile } from "../lib/profile-data.ts";
import { readFileSync } from "node:fs";
export async function ensureDemo(reset = false) {
  if (process.env.DEMO_ENABLED !== "true") throw Error("Demo is disabled");
  const email = process.env.DEMO_EMAIL,
    password = process.env.DEMO_PASSWORD;
  if (!email || !password) throw Error("Demo credentials missing");
  let user = db.prepare("SELECT id FROM user WHERE email=?").get(email) as
    | { id: string }
    | undefined;
  if (!user) {
    const result = await auth.api.signUpEmail({
      body: { email, password, name: "Phương" },
    });
    user = { id: result.user.id };
  }
  if (
    reset ||
    !db
      .prepare("SELECT user_id FROM skill_profiles WHERE user_id=?")
      .get(user.id)
  ) {
    saveProfile(user.id, structuredClone(demoProfile));
    const content = readFileSync("src/data/demo-cv.pdf");
    db.prepare(
      "INSERT INTO career_cvs(user_id,filename,mime,content,extracted_text,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET filename=excluded.filename,mime=excluded.mime,content=excluded.content,extracted_text=excluded.extracted_text,created_at=excluded.created_at",
    ).run(
      user.id,
      "CV_Phuong.pdf",
      "application/pdf",
      content,
      demoProfile.skills.join(", "),
      new Date().toISOString(),
    );
  }
  return { id: user.id, email, password };
}
