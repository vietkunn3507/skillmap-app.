import { currentSession } from "@/server/session";
import { allMarketJobs } from "@/server/market";
import { locationRegistry, matchesLocation, rankValues } from "@/lib/geography";
import type { Job } from "@/lib/types";
export async function GET(request: Request) {
  if (!(await currentSession()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const key = params.get("key") || "";
  const industry = params.get("industry") || "";
  if (
    !locationRegistry.some((l) => l.key === key) ||
    !["", "it_data", "ke_toan_tai_chinh"].includes(industry)
  )
    return Response.json({ error: "Invalid location" }, { status: 400 });
  try {
    const jobs = (await allMarketJobs(industry)).filter((j) =>
      matchesLocation(j.location || "", key),
    );
    const sample = jobs.slice(0, 40);
    const skills: string[] = [];
    let failed = 0;
    const origin = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    ).replace(/\/$/, "");
    for (let i = 0; i < sample.length; i += 8) {
      await Promise.all(
        sample.slice(i, i + 8).map(async (j) => {
          try {
            const r = await fetch(origin + "/api/jobs/" + j.job_id, {
              cache: "no-store",
              signal: AbortSignal.timeout(10000),
            });
            if (!r.ok) throw Error();
            const detail: Job = await r.json();
            skills.push(
              ...new Set(detail.skills?.map((s) => s.skill_display) || []),
            );
          } catch {
            failed++;
          }
        }),
      );
    }
    return Response.json(
      {
        count: jobs.length,
        occupations: rankValues(jobs.map((j) => j.job_title)).slice(0, 5),
        industries: rankValues(jobs.map((j) => j.industry)),
        skills: failed ? null : rankValues(skills).slice(0, 5),
        skillsSampleSize: sample.length,
        jobs: jobs.slice(0, 10),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Không tải được chi tiết khu vực." },
      { status: 502 },
    );
  }
}
