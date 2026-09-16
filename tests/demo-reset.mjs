import { request } from "@playwright/test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
const base = "http://localhost:3000";
const c = await request.newContext({
  baseURL: base,
  extraHTTPHeaders: { Origin: base },
});
assert.equal((await c.post("/api/demo-login")).status(), 200);
await c.patch("/api/profile", {
  data: {
    whatIf: "test",
    savedSkills: [],
    target: "test",
    plan: [],
    completed: ["SQL"],
  },
});
execFileSync(
  process.execPath,
  [
    "--env-file=.env.local",
    "--experimental-transform-types",
    "scripts/reset-demo.mts",
  ],
  { env: { ...process.env, RESET_DEMO_DATA: "true" }, stdio: "pipe" },
);
const p = await (await c.get("/api/profile")).json();
assert.equal(p.target, "Financial Analyst");
assert.equal(p.whatIf, "");
assert.deepEqual(p.savedSkills, ["SQL", "Financial Modeling"]);
assert.deepEqual(p.completed, []);
assert.equal(p.cv.status, "analyzed");
assert.equal((await c.post("/api/cv/analyze")).status(), 200);
execFileSync(
  process.execPath,
  [
    "--env-file=.env.local",
    "--experimental-transform-types",
    "scripts/reset-demo.mts",
  ],
  { env: { ...process.env, RESET_DEMO_DATA: "true" }, stdio: "pipe" },
);
await c.dispose();
console.log("PASS demo reset and real demo PDF extraction");
