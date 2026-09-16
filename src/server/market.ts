import type { Job } from "../lib/types";
const cache = new Map<string, { expires: number; promise: Promise<Job[]> }>();
export async function allMarketJobs(industry: string) {
  const key = industry;
  const current = cache.get(key);
  if (current && current.expires > Date.now()) return current.promise;
  const promise = (async () => {
    const jobs: Job[] = [];
    const origin = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    ).replace(/\/$/, "");
    for (let offset = 0; offset < 20000; offset += 200) {
      const query = new URLSearchParams({
        limit: "200",
        offset: String(offset),
      });
      if (industry) query.set("industry", industry);
      const r = await fetch(origin + "/api/jobs?" + query, {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) throw Error("Không tải được dữ liệu tuyển dụng.");
      const page = await r.json();
      jobs.push(...page.jobs);
      if (page.jobs.length < 200)
        return [...new Map(jobs.map((j) => [j.job_id, j])).values()];
    }
    throw Error("Chưa thể tải đầy đủ dữ liệu.");
  })();
  cache.set(key, { expires: Date.now() + 60000, promise });
  promise.catch(() => cache.delete(key));
  return promise;
}
