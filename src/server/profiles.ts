import { db } from "./db.ts";
import { profileDefaults } from "../lib/profile-data.ts";
import type { Profile } from "../lib/types.ts";
export function getProfile(id: string, name = ""): Profile {
  const row = db
    .prepare("SELECT data FROM skill_profiles WHERE user_id=?")
    .get(id) as { data: string } | undefined;
  return row
    ? { ...profileDefaults, ...JSON.parse(row.data) }
    : { ...profileDefaults, name };
}
export function saveProfile(id: string, profile: Profile) {
  db.prepare(
    "INSERT INTO skill_profiles(user_id,data,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at",
  ).run(id, JSON.stringify(profile), new Date().toISOString());
}
const stringFields = [
  "name",
  "education",
  "target",
  "field",
  "status",
  "whatIf",
] as const;
const arrays = [
  "skills",
  "plan",
  "completed",
  "savedSkills",
  "savedOccupations",
  "tools",
  "tasks",
  "languages",
] as const;
export function validatePatch(input: unknown): Partial<Profile> {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw Error("Invalid profile");
  const data = input as Record<string, unknown>;
  const patch: Partial<Profile> = {};
  for (const key of stringFields) {
    if (key in data) {
      if (typeof data[key] !== "string" || data[key].length > 200)
        throw Error("Invalid field");
      patch[key] = data[key];
    }
  }
  for (const key of arrays) {
    if (key in data) {
      const value = data[key];
      if (
        !Array.isArray(value) ||
        value.length > 100 ||
        value.some((x) => typeof x !== "string" || x.length > 150)
      )
        throw Error("Invalid list");
      patch[key] = [...new Set(value.map((x) => x.trim()).filter(Boolean))];
    }
  }
  if ("saved" in data) {
    if (
      !Array.isArray(data.saved) ||
      data.saved.length > 500 ||
      data.saved.some((n) => !Number.isSafeInteger(n) || n < 0)
    )
      throw Error("Invalid bookmarks");
    patch.saved = [...new Set(data.saved)];
  }
  if ("industry" in data) {
    if (!["it_data", "ke_toan_tai_chinh"].includes(String(data.industry)))
      throw Error("Invalid industry");
    patch.industry = data.industry as Profile["industry"];
  }
  return patch;
}
