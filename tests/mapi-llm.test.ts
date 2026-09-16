import test from "node:test";
import assert from "node:assert/strict";
import {
  answerWithLlm,
  validatePlan,
  numbersGrounded,
  type Generate,
} from "../src/server/mapi-llm.ts";
import { demoProfile } from "../src/lib/profile-data.ts";
const plan = {
  datasets: ["trend"],
  industry: "ke_toan_tai_chinh",
  skill: "Excel",
  jobId: null,
  direction: "rising",
};
const controller = new AbortController();
test("query planner cannot escape the allowlist or invent backend URLs", () => {
  assert.throws(() =>
    validatePlan({ ...plan, datasets: ["http://evil.invalid"] }),
  );
  assert.throws(() => validatePlan({ ...plan, industry: "anything" }));
  assert.throws(() => validatePlan({ ...plan, jobId: -1 }));
  assert.throws(() =>
    validatePlan({ ...plan, datasets: ["top", "trend", "jobs", "macro"] }),
  );
});
test("LLM pipeline retrieves real series, minimizes personal fields, and attaches server-owned citations", async () => {
  const calls: string[] = [];
  let count = 0;
  const generate: Generate = async (_instructions, input) => {
    assert.doesNotMatch(JSON.stringify(input), /CV_Phuong|@demo|demo-password/);
    if (count++ === 0) return plan;
    assert.match(JSON.stringify(input), /33.07/);
    return {
      paragraphs: [
        { text: "Excel được nhắc trong 33,07% tin năm 2026.", sources: ["E1"] },
      ],
      caveat: "Đây là dữ liệu trong mẫu, không phải toàn thị trường.",
    };
  };
  const answer = await answerWithLlm(
    demoProfile,
    "Excel thay đổi thế nào?",
    undefined,
    async (path) => {
      calls.push(path);
      return {
        skills: [
          {
            skill: "Excel",
            series: [
              { year: 2026, share_pct: 33.07, n_mentions: 85, n_postings: 257 },
            ],
          },
          { skill: "Chế độ kế toán", series: [] },
        ],
      };
    },
    controller.signal,
    generate,
  );
  assert.deepEqual(calls, [
    "/skills/trend?industry=ke_toan_tai_chinh&top_n=50",
  ]);
  assert.equal(answer.engine, "llm");
  assert.equal(answer.citations?.[0].id, "E1");
  assert.ok(
    answer.citations?.[0].href.startsWith("/api/backend/skills/trend?"),
  );
});
test("unknown citations and unsupported numbers fail closed", async () => {
  for (const [text, sources] of [
    ["Excel sẽ tăng 99%.", ["E1"]],
    ["Không có nguồn.", ["E99"]],
  ] as [string, string[]][]) {
    let n = 0;
    const generate: Generate = async () =>
      n++ === 0 ? plan : { paragraphs: [{ text, sources }], caveat: "" };
    await assert.rejects(
      answerWithLlm(
        demoProfile,
        "Excel?",
        undefined,
        async () => ({
          skills: [
            { skill: "Excel", series: [{ year: 2026, share_pct: 33.07 }] },
          ],
        }),
        controller.signal,
        generate,
      ),
      /INVALID_LLM_CITATION|UNGROUNDED_NUMBER/,
    );
  }
  assert.equal(numbersGrounded("Có 1.514 tin.", [{ total_jobs: 1514 }]), true);
  assert.equal(numbersGrounded("Tỷ lệ 3307%.", [{ share_pct: 33.07 }]), false);
  assert.equal(numbersGrounded("Tỷ lệ 33,07%.", [{ share_pct: 33.07 }]), true);
  assert.equal(
    numbersGrounded("Chắc chắn 82% được nhận.", [{ total_jobs: 1514 }]),
    false,
  );
});
test("retrieval failure aborts before synthesis; model cannot invent an unrelated job ID", async () => {
  let calls = 0;
  await assert.rejects(
    answerWithLlm(
      demoProfile,
      "Excel?",
      undefined,
      async () => {
        throw Error("backend offline");
      },
      controller.signal,
      async () => {
        calls++;
        return plan;
      },
    ),
    /backend offline/,
  );
  assert.equal(calls, 1);
  await assert.rejects(
    answerWithLlm(
      demoProfile,
      "Tôi hợp nghề nào?",
      undefined,
      async () => {
        throw Error("should not fetch");
      },
      controller.signal,
      async () => ({ ...plan, datasets: ["job"], jobId: 42 }),
    ),
    /UNSUPPORTED_JOB_ID/,
  );
});
test("follow-up questions retain a bounded question history and still retrieve fresh evidence", async () => {
  const history = ["Excel có phổ biến trong ngành kế toán năm nay không?"];
  let n = 0;
  let reads = 0;
  const generate: Generate = async (_instructions, input) => {
    assert.deepEqual(
      (input as { previousQuestions: string[] }).previousQuestions,
      history,
    );
    return n++ === 0
      ? plan
      : {
          paragraphs: [{ text: "Năm 2023, tỷ lệ là 24,28%.", sources: ["E1"] }],
          caveat: "",
        };
  };
  await answerWithLlm(
    demoProfile,
    "Còn năm trước?",
    undefined,
    async () => {
      reads++;
      return {
        skills: [
          { skill: "Excel", series: [{ year: 2023, share_pct: 24.28 }] },
        ],
      };
    },
    controller.signal,
    generate,
    history,
  );
  assert.equal(reads, 1);
  assert.equal(n, 2);
  await assert.rejects(
    answerWithLlm(
      demoProfile,
      "Tiếp nhé",
      undefined,
      async () => ({}),
      controller.signal,
      generate,
      Array(5).fill("dài"),
    ),
    /INVALID_HISTORY/,
  );
});
