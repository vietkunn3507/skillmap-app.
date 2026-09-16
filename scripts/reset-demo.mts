import { ensureDemo } from "../src/server/demo-account.ts";
if (
  process.env.DEMO_ENABLED !== "true" ||
  process.env.RESET_DEMO_DATA !== "true"
)
  throw Error(
    "Set DEMO_ENABLED=true and RESET_DEMO_DATA=true explicitly to reset only the presentation account.",
  );
await ensureDemo(true);
console.log(
  "Phương demo profile, CV, skills, bookmarks, goals and learning plan restored.",
);
