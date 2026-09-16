export type Industry = "it_data" | "ke_toan_tai_chinh";
export interface Overview {
  total_jobs: number;
  total_skills: number;
  by_industry: { industry: Industry; n: number }[];
  by_year_industry: { year: number; industry: Industry; n: number }[];
  data_source: string;
}
export interface Skill {
  skill_display: string;
  esco_label: string | null;
  n_jobs: number;
}
export interface Trend {
  skill: string;
  series: {
    year: number;
    share_pct: number;
    n_mentions: number;
    n_postings: number;
  }[];
}
export interface Gradient {
  skill: string;
  n_total: number;
  share_junior: number;
  share_senior: number;
  SEI: number;
}
export interface MacroRow {
  year: number;
  skill_level: string;
  employment_thousands: number;
  share_pct: number;
}
export interface Job {
  job_id: number;
  job_title: string;
  company_name: string;
  industry: Industry;
  location: string;
  seniority: string;
  experience_required: string;
  salary_min: number | null;
  salary_max: number | null;
  posted_date: string;
  year: number;
  source_url?: string;
  skills?: { skill_display: string; esco_label: string | null }[];
}
export interface CareerMatch {
  fit?: number;
  demo?: boolean;
  job_title: string;
  industry: Industry;
  matched_skills: number;
  n_similar_jobs: number;
}
export interface MatchResponse {
  input_skills: string[];
  matches: CareerMatch[];
}
export interface Profile {
  savedSkills: string[];
  savedOccupations: string[];
  tools: string[];
  tasks: string[];
  languages: string[];
  field: string;
  status: string;
  whatIf: string;
  demo: boolean;
  cv: null | {
    filename: string;
    status: "uploaded" | "analyzed";
    analyzedAt?: string;
  };
  name: string;
  education: string;
  industry: Industry;
  skills: string[];
  plan: string[];
  completed: string[];
  saved: number[];
  target: string;
}
