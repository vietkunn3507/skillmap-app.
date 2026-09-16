import { getMigrations } from "better-auth/db/migration";
import { auth } from "../src/server/auth.ts";
await (await getMigrations(auth.options)).runMigrations();
console.log("Authentication schema ready.");
