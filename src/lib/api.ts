import { visibleEntities, type EntityEvidence } from "./taxonomy.ts";
import type {
  Industry,
  Overview,
  Skill,
  Trend,
  Gradient,
  MacroRow,
  Job,
  MatchResponse,
} from "./types";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function query(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== "") q.set(key, String(value));
  return q.size ? `?${q}` : "";
}
export async function request<T>(
  path: string,
  signal?: AbortSignal,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    signal,
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok)
    throw new ApiError(
      response.status === 404
        ? "Không tìm thấy dữ liệu."
        : response.status === 422
          ? "Bộ lọc chưa hợp lệ. Vui lòng kiểm tra lại."
          : "Không thể kết nối dữ liệu. Vui lòng thử lại.",
      response.status,
    );
  return response.json();
}
const skillRows = <T extends object>(rows: T[], label: (row: T) => string) =>
  visibleEntities(rows, label, "skill", (row) => row as EntityEvidence);
export const api = {
  overview: (signal?: AbortSignal) =>
    request<Overview>("/market/overview", signal),
  top: (industry: Industry, signal?: AbortSignal) =>
    request<{ industry: string; skills: Skill[] }>(
      `/skills/top${query({ industry, limit: 100 })}`,
      signal,
    ).then((data) => ({
      ...data,
      skills: skillRows(data.skills, (s) => s.skill_display),
    })),
  trend: (industry: Industry, signal?: AbortSignal) =>
    request<{ industry: string; skills: Trend[] }>(
      `/skills/trend${query({ industry, top_n: 50 })}`,
      signal,
    ).then((data) => ({
      ...data,
      skills: skillRows(data.skills, (s) => s.skill),
    })),
  gradient: (industry: Industry, direction: string, signal?: AbortSignal) =>
    request<{ skills: Gradient[] }>(
      `/skills/seniority-gradient${query({ industry: industry === "it_data" ? "IT - Data" : "Tài chính - Kế toán", direction, limit: 50 })}`,
      signal,
    ).then((data) => ({
      ...data,
      skills: skillRows(data.skills, (s) => s.skill).filter(
        (s) =>
          Number.isFinite(s.SEI) &&
          (direction === "rising" ? s.SEI > 1 : s.SEI < 1),
      ),
    })),
  macro: (signal?: AbortSignal) =>
    request<{ rows: MacroRow[]; warning: string }>(
      "/macro/skill-level-trend",
      signal,
    ),
  jobs: (
    params: {
      industry?: Industry;
      year?: number;
      skill?: string;
      offset?: number;
      limit?: number;
    },
    signal?: AbortSignal,
  ) =>
    request<{ jobs: Job[]; limit: number; offset: number }>(
      `/jobs${query(params)}`,
      signal,
    ),
  job: (id: number, signal?: AbortSignal) =>
    request<Job>(`/jobs/${id}`, signal).then((data) => ({
      ...data,
      skills: data.skills
        ? skillRows(data.skills, (s) => s.skill_display)
        : undefined,
    })),
  match: (skills: string[], signal?: AbortSignal) =>
    request<MatchResponse>("/career/match", signal, skills).then((data) => ({
      ...data,
      matches: visibleEntities(data.matches, (m) => m.job_title, "occupation"),
    })),
};
