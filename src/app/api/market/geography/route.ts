import { currentSession } from "@/server/session";
import { allMarketJobs } from "@/server/market";
import { aggregateLocations } from "@/lib/geography";
export async function GET(request: Request) {
  if (!(await currentSession()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const industry = new URL(request.url).searchParams.get("industry") || "";
  if (!["", "it_data", "ke_toan_tai_chinh"].includes(industry))
    return Response.json({ error: "Invalid industry" }, { status: 400 });
  try {
    const jobs = await allMarketJobs(industry);
    return Response.json(
      { locations: aggregateLocations(jobs), total: jobs.length },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Không tải được dữ liệu bản đồ." },
      { status: 502 },
    );
  }
}
