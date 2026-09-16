import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeEntity,
  visibleEntities,
  occupationSkills,
  formatSkillLabel,
} from "../src/lib/taxonomy.ts";
test("rejects malformed, generic and unreviewed extraction fragments", () => {
  for (const label of [
    "Chế độ kế toán",
    "Lưu ký hàng",
    "Lưu ký năng",
    "Kế hoạch",
    "Tài liệu",
    "Các sản phẩm",
    "unreviewed noun fragment",
    "SQL<script>",
    "SQL💩",
    "SQL\nExcel",
  ])
    assert.equal(normalizeEntity(label, "skill"), null, label);
  assert.equal(normalizeEntity("Excel", "skill", { confidence: 0.2 }), null);
  assert.equal(normalizeEntity("Excel", "skill", { confidence: NaN }), null);
  assert.equal(
    normalizeEntity("Chế độ kế toán", "skill", {
      entity_type: "skill",
      confidence: 1,
    }),
    null,
  );
});
test("entity types are separate, accounting requires explicit skill classification", () => {
  assert.equal(normalizeEntity("accounting", "occupation")?.label, "Kế toán");
  assert.equal(normalizeEntity("accounting", "skill"), null);
  assert.equal(
    normalizeEntity("Kế toán", "skill", { entity_type: "skill" })?.label,
    "Kế toán",
  );
  assert.equal(
    normalizeEntity("Excel", "skill", { entity_type: "occupation" }),
    null,
  );
  assert.equal(normalizeEntity("Financial Analyst", "skill"), null);
  assert.equal(normalizeEntity("Làm dashboard", "skill"), null);
  assert.equal(normalizeEntity("Làm dashboard", "task")?.type, "task");
  assert.equal(normalizeEntity("Excel", "task"), null);
});
test("synonyms collapse without changing records or summing overlapping job counts", () => {
  const rows = Object.freeze([
    Object.freeze({ label: "Báo cáo tài chính", n_jobs: 12 }),
    Object.freeze({ label: "Lập BCTC", n_jobs: 9 }),
    Object.freeze({ label: "Financial reporting", n_jobs: 11 }),
    Object.freeze({ label: "Excel", n_jobs: 20 }),
  ]);
  const result = visibleEntities(rows, (r) => r.label, "skill");
  assert.equal(result.length, 2);
  assert.equal(result[0], rows[0]);
  assert.equal(result[0].n_jobs, 12);
  assert.equal(rows[2].label, "Financial reporting");
  for (const s of rows.slice(0, 3))
    assert.equal(formatSkillLabel(s.label), "Lập báo cáo tài chính");
});
test("occupation relationships consist of distinct verified skills", () => {
  assert.equal(occupationSkills.accounting.skills.length, 7);
  assert.equal(occupationSkills.audit.skills.length, 6);
  for (const occupation of Object.values(occupationSkills)) {
    assert.equal(
      visibleEntities(occupation.skills, (s) => s, "skill").length,
      occupation.skills.length,
    );
    for (const skill of occupation.skills)
      assert.equal(normalizeEntity(skill, "skill")?.label, skill);
  }
});
