import {
  skillKey,
  formatOccupationLabel,
  formatSkillLabel as fallbackSkillLabel,
} from "./display.ts";

export type EntityType = "occupation" | "skill" | "task";
export interface EntityEvidence {
  entity_type?: EntityType;
  confidence?: number;
}
type Entry = { label: string; type: EntityType };
const registry = new Map<string, Entry>();
function register(type: EntityType, label: string, aliases: string[] = []) {
  for (const alias of [label, ...aliases])
    registry.set(`${type}:${skillKey(alias)}`, { label, type });
}
// Deliberately reviewed vocabulary. Unknown extractions stay out until reviewed;
// a typed, high-confidence backend entity can extend it without changing raw data.
const technical =
  "Excel|Power BI|SQL|Python|Java|JavaScript|TypeScript|React|Node.js|Vue|Angular|C#|C++|C/C++|PHP|HTML|CSS|Git|GitHub|Docker|Kubernetes|PostgreSQL|MySQL|MongoDB|SQL Server|Oracle|Redis|Linux|AWS|GCP|Google Cloud|Azure|Terraform|Kafka|Elasticsearch|FastAPI|Django|Spring Boot|.NET|ASP.NET|.NET Core|Flutter|Swift|Kotlin|Go|Figma|Tableau|MISA|FAST Accounting|ERP|CRM|ETL|CI/CD|REST API|UI/UX|Machine Learning|Computer Vision|TensorFlow|Scrum|Agile|Jira|Photoshop|Illustrator|Word|PowerPoint|Bootstrap|jQuery|JSON|Unity|Hibernate|WordPress|WebSocket";
technical.split("|").forEach((s) => register("skill", s));
register("skill", "Excel", ["Kỹ năng Excel", "Microsoft Excel"]);
register("skill", "Word", ["Kỹ năng Word", "Microsoft Word"]);
register("skill", "AMIS", ["Kế toán Amis"]);
register("skill", "React", ["ReactJS", "React.js"]);
register("skill", "Node.js", ["nodejs"]);
register("skill", "Vue", ["vuejs", "vue.js"]);
register("skill", "Go", ["golang"]);
const skills: [string, string[]][] = [
  ["Hạch toán kế toán", ["bookkeeping"]],
  [
    "Lập báo cáo tài chính",
    ["financial reporting", "Báo cáo tài chính", "Lập BCTC"],
  ],
  ["Đối chiếu số liệu", ["reconciliation"]],
  ["Kế toán thuế", ["tax accounting"]],
  ["Kiểm tra chứng từ", ["document verification"]],
  ["Phân tích tài chính", ["financial analysis"]],
  ["Mô hình hóa tài chính", ["financial modeling", "financial modelling"]],
  ["Kiểm toán báo cáo tài chính", ["financial statement auditing"]],
  ["Kiểm soát nội bộ", ["internal control", "internal controls"]],
  ["Đánh giá rủi ro", ["risk assessment"]],
  ["Tiếng Anh", ["English"]],
  ["Tiếng Việt", ["Vietnamese"]],
  ["Phân tích dữ liệu", ["data analysis"]],
  ["Giao tiếp", ["communication"]],
  ["Làm việc nhóm", ["teamwork"]],
  ["Quản lý dự án", ["project management"]],
  ["Lập trình", ["programming"]],
  ["Tư duy lập trình", ["tu duy lap trinh tot"]],
  ["Kiểm thử phần mềm", ["software testing"]],
  ["Thiết kế CSDL", ["database design"]],
  ["Phân tích yêu cầu", ["requirements analysis"]],
  ["Viết tài liệu", ["technical writing"]],
  ["Excel nâng cao", ["excel cao cap", "excel nang cao pivot table"]],
  ["Phát triển phần mềm", ["software development"]],
  ["Bảo mật mạng", ["network security"]],
  ["Xử lý dữ liệu", ["data processing"]],
];
skills.forEach(([label, aliases]) => register("skill", label, aliases));
register("occupation", "Kế toán", ["accounting", "accountant"]);
register("occupation", "Kiểm toán", ["audit", "auditing", "auditor"]);
for (const role of [
  "Financial Analyst",
  "Business Analyst",
  "Data Analyst",
  "Data Engineer",
  "Data Scientist",
  "Lập trình viên",
  "Kỹ sư dữ liệu",
  "Kế toán tổng hợp",
])
  register("occupation", role);
for (const task of [
  "Phân tích báo cáo tài chính",
  "Làm dashboard",
  "Tổng hợp dữ liệu",
  "Lập báo cáo",
  "Phân tích doanh thu",
])
  register("task", task);
const rejected = new Set(
  [
    "Chế độ kế toán",
    "Lưu ký hàng",
    "Lưu ký năng",
    "Kế hoạch",
    "Tài liệu",
    "Các sản phẩm",
    "Công nợ",
    "Tài chính",
    "Microsoft",
    "Chế độ",
    "Phúc lợi",
    "Quyền lợi",
    "Hành chính",
    "Theo quy định",
  ].map(skillKey),
);
export function normalizeEntity(
  raw: string,
  type: EntityType,
  evidence: EntityEvidence = {},
): Entry | null {
  if (typeof raw !== "string") return null;
  const key = skillKey(raw);
  if (
    !key ||
    raw.length > 100 ||
    !/^[\p{L}\p{M}\p{N}+#. /_–—-]+$/u.test(raw) ||
    /[<>\n\r\uFFFD]|https?:|[!?;=]/i.test(raw) ||
    rejected.has(key)
  )
    return null;
  if (
    evidence.confidence !== undefined &&
    (!Number.isFinite(evidence.confidence) ||
      evidence.confidence < 0.8 ||
      evidence.confidence > 1)
  )
    return null;
  if (evidence.entity_type && evidence.entity_type !== type) return null;
  const known = registry.get(`${type}:${key}`);
  if (known) return known;
  const otherType = [...registry.entries()].some(([id]) =>
    id.endsWith(`:${key}`),
  );
  const explicit = evidence.entity_type === type;
  // Accounting is an occupation unless the backend explicitly identifies a skill.
  if (type === "skill" && ["accounting", "ke toan"].includes(key))
    return explicit ? { type, label: "Kế toán" } : null;
  if (otherType) return null;
  if (
    type === "occupation" &&
    /\b(analyst|engineer|developer|scientist|accountant|auditor|manager|ke toan|kiem toan|lap trinh vien|ky su|chuyen vien)\b/.test(
      key,
    )
  )
    return { type, label: formatOccupationLabel(raw) };
  if (
    explicit &&
    evidence.confidence !== undefined &&
    /^[\p{L}\p{N}+#. /_-]+$/u.test(raw.trim()) &&
    key.split(" ").length >= 2
  )
    return { type, label: raw.trim() };
  return null;
}
/** Keeps the first representative and original source objects. Never sums alias counts. */
export function visibleEntities<T>(
  items: readonly T[],
  label: (item: T) => string,
  type: EntityType,
  evidence: (item: T) => EntityEvidence = (item) =>
    typeof item === "object" && item !== null ? (item as EntityEvidence) : {},
): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const entity = normalizeEntity(label(item), type, evidence(item));
    if (!entity) return false;
    const key = skillKey(entity.label);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export const visibleSkills = (items: readonly string[]) =>
  visibleEntities(items, (s) => s, "skill");
export const occupationSkills = {
  accounting: {
    label: "Kế toán",
    skills: [
      "Hạch toán kế toán",
      "Lập báo cáo tài chính",
      "Đối chiếu số liệu",
      "Kế toán thuế",
      "Excel",
      "Kiểm tra chứng từ",
      "Phân tích tài chính",
    ],
  },
  audit: {
    label: "Kiểm toán",
    skills: [
      "Kiểm toán báo cáo tài chính",
      "Kiểm soát nội bộ",
      "Đánh giá rủi ro",
      "Kiểm tra chứng từ",
      "Đối chiếu số liệu",
      "Excel",
    ],
  },
} as const;

export {
  skillKey,
  formatOccupationLabel,
  formatLocationLabel,
} from "./display.ts";
// Formatting is separate from visibility so raw profile fields remain editable.
export function formatSkillLabel(raw: string) {
  return normalizeEntity(raw, "skill")?.label ?? fallbackSkillLabel(raw);
}
