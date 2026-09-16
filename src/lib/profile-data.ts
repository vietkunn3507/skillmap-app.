export const profileDefaults = {
  name: "",
  education: "",
  industry: "it_data" as const,
  skills: [] as string[],
  plan: [] as string[],
  completed: [] as string[],
  saved: [] as number[],
  target: "",
  savedSkills: [] as string[],
  savedOccupations: [] as string[],
  tools: [] as string[],
  tasks: [] as string[],
  languages: [] as string[],
  field: "",
  status: "",
  whatIf: "",
  demo: false,
  cv: null as null | {
    filename: string;
    status: "uploaded" | "analyzed";
    analyzedAt?: string;
  },
};
export const demoProfile = {
  ...profileDefaults,
  name: "Phương",
  education: "Sinh viên",
  status: "Sinh viên",
  field: "Tài chính / Kinh doanh",
  industry: "ke_toan_tai_chinh" as const,
  skills: ["Excel", "Power BI", "Accounting", "English", "Financial Analysis"],
  tools: ["Excel", "Power BI"],
  tasks: [
    "Phân tích báo cáo tài chính",
    "Làm dashboard",
    "Tổng hợp dữ liệu",
    "Lập báo cáo",
    "Phân tích doanh thu",
  ],
  languages: ["Tiếng Việt", "Tiếng Anh"],
  target: "Financial Analyst",
  plan: ["SQL", "Financial Modeling", "Python"],
  savedOccupations: ["Financial Analyst", "Business Analyst", "Data Analyst"],
  savedSkills: ["SQL", "Financial Modeling"],
  demo: true,
  cv: {
    filename: "CV_Phuong.pdf",
    status: "analyzed" as const,
    analyzedAt: "2026-09-13T00:00:00.000Z",
  },
};
export const demoMatches = [
  {
    job_title: "Financial Analyst",
    industry: "ke_toan_tai_chinh" as const,
    matched_skills: 4,
    n_similar_jobs: 0,
    fit: 82,
    demo: true,
  },
  {
    job_title: "Business Analyst",
    industry: "ke_toan_tai_chinh" as const,
    matched_skills: 3,
    n_similar_jobs: 0,
    fit: 74,
    demo: true,
  },
  {
    job_title: "Data Analyst",
    industry: "it_data" as const,
    matched_skills: 2,
    n_similar_jobs: 0,
    fit: 67,
    demo: true,
  },
];
export const demoGaps = [
  { skill: "SQL", priority: "Ưu tiên cao" },
  { skill: "Financial Modeling", priority: "Ưu tiên cao" },
  { skill: "Python", priority: "Ưu tiên sau" },
];
