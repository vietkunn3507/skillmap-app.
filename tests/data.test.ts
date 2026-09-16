import assert from "node:assert/strict";
import test from "node:test";
import { query, request, ApiError } from "../src/lib/api.ts";
import { salary, splitMacro, sameSkill } from "../src/lib/format.ts";
test("query safely encodes Vietnamese skills and preserves zero offset", () => {
  const q = query({
    industry: "it_data",
    skill: "Kế toán & SQL",
    offset: 0,
    year: undefined,
  });
  const p = new URLSearchParams(q);
  assert.equal(p.get("skill"), "Kế toán & SQL");
  assert.equal(p.get("offset"), "0");
  assert.equal(p.has("year"), false);
});
test("missing salaries remain unknown and zero is not a fabricated salary", () => {
  assert.equal(salary(null, null), "Chưa công bố");
  assert.match(salary(13000000, 19000000), /13 tr – 19 tr/);
  assert.match(salary(null, 19000000), /^Đến/);
});
test("macro series never join the 2021 methodology break", () => {
  const [before, after] = splitMacro([
    { year: 2020 },
    { year: 2021 },
    { year: 2024 },
  ]);
  assert.deepEqual(before, [{ year: 2020 }]);
  assert.deepEqual(after, [{ year: 2021 }, { year: 2024 }]);
});
test("skill comparison is case insensitive without inventing synonyms", () => {
  assert.equal(sameSkill(" SQL ", "sql"), true);
  assert.equal(sameSkill("Kế toán", "Accounting"), false);
});
test("API errors propagate rather than returning demo data", async () => {
  const original = global.fetch;
  global.fetch = async () => new Response("{}", { status: 502 });
  try {
    await assert.rejects(
      request("/jobs"),
      (e) => e instanceof ApiError && e.status === 502,
    );
  } finally {
    global.fetch = original;
  }
});
