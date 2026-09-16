import test from "node:test";
import assert from "node:assert/strict";
import { answerMapi, type MapiEvidence } from "../src/server/mapi.ts";
import { demoProfile, profileDefaults } from "../src/lib/profile-data.ts";
const noData: MapiEvidence = {
  top: async () => ({ skills: [] }),
  match: async () => ({ matches: [], input_skills: [] }),
  job: async () => {
    throw Error("not found");
  },
};
test("demo uses server profile seed and never invents post-learning scores", async () => {
  const r = await answerMapi(
    structuredClone(demoProfile),
    "SQL hay Python nên học trước?",
    undefined,
    noData,
  );
  assert.equal(r.cards[0].skill, "SQL");
  assert.equal(r.cards[0].rows?.[0].value, "82%");
  assert.equal(r.cards[0].rows?.[1].value, "3");
  assert.doesNotMatch(JSON.stringify(r), /89%|\+7%/);
  assert.match(r.cards[0].source, /demo/);
});
test("new accounts never inherit demo gaps or scores", async () => {
  const r = await answerMapi(
    { ...profileDefaults, name: "An", target: "Financial Analyst" },
    "Tôi còn thiếu gì?",
    undefined,
    noData,
  );
  assert.equal(r.state, "attention");
  assert.equal(r.cards.length, 0);
  assert.doesNotMatch(JSON.stringify(r), /82%|Phương/);
});
test("backend counts are reproduced without simulated market fallback", async () => {
  const r = await answerMapi(
    demoProfile,
    "Thị trường đang cần kỹ năng gì?",
    undefined,
    {
      ...noData,
      top: async () => ({
        skills: [{ skill_display: "sql", n_jobs: 17, esco_label: null }],
      }),
    },
  );
  assert.equal(r.cards[0].rows?.[0].value, "17 tin");
  assert.equal(r.cards[0].rows?.[0].label, "SQL");
});
test("completed or already held skill is no longer the recommended next step", async () => {
  const r = await answerMapi(
    {
      ...demoProfile,
      skills: [...demoProfile.skills, "SQL"],
      completed: ["SQL"],
    },
    "Có đường nào ngắn hơn không?",
    { kind: "path", value: "Financial Analyst" },
    noData,
  );
  assert.equal(r.cards[0].skill, "Financial Modeling");
  assert.equal(r.cards[0].rows?.[1].value, "2");
  assert.equal(r.cards[0].rows?.[0].value, "82%");
});
test("unknown questions and salary projections explicitly abstain", async () => {
  for (const q of [
    "Mức lương của tôi sau khi học SQL?",
    "Tôi sẽ đạt 89% chứ?",
    "Viết một bài thơ",
  ]) {
    const r = await answerMapi(demoProfile, q, undefined, noData);
    assert.equal(r.state, "attention");
    assert.match(r.text, /chưa có đủ dữ liệu/);
    assert.equal(r.cards.length, 0);
  }
});
test("job context uses actual extracted skills, without an invented fit score", async () => {
  const r = await answerMapi(
    demoProfile,
    "Tôi phù hợp tin này không?",
    { kind: "job", value: "7" },
    {
      ...noData,
      job: async () => ({
        job_id: 7,
        job_title: "Analyst",
        company_name: "Test",
        industry: "it_data",
        location: "",
        seniority: "",
        experience_required: "",
        salary_min: null,
        salary_max: null,
        posted_date: "",
        year: 2026,
        skills: [
          { skill_display: "Excel", esco_label: null },
          { skill_display: "SQL", esco_label: null },
        ],
      }),
    },
  );
  assert.deepEqual(
    r.cards[0].rows?.map((x) => x.value),
    ["1", "1"],
  );
  assert.doesNotMatch(JSON.stringify(r), /82%/);
  assert.equal(r.cards[0].skill, "SQL");
});
test("service failure is never replaced by a success response with invented evidence", async () => {
  await assert.rejects(
    () =>
      answerMapi(demoProfile, "Thị trường đang cần kỹ năng gì?", undefined, {
        ...noData,
        top: async () => {
          throw Error("offline");
        },
      }),
    /offline/,
  );
});
