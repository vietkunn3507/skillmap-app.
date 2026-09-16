"use client";
import { visibleEntities } from "@/lib/taxonomy";
import { useState } from "react";
import geo from "@/data/vietnam-map.json";
import { useResource } from "@/lib/use-resource";
import { number, industryName } from "@/lib/format";
import { formatSkillLabel, formatOccupationLabel } from "@/lib/taxonomy";
import { DataState, SectionTitle, Sheet } from "./ui";
import { JobSheet } from "./jobs";
import type { Job, Industry } from "@/lib/types";
type Location = {
  key: string;
  label: string;
  count: number;
  x: number;
  y: number;
};
type Detail = {
  count: number;
  occupations: { name: string; count: number }[];
  industries: { name: string; count: number }[];
  skills: { name: string; count: number }[] | null;
  skillsSampleSize: number;
  jobs: Job[];
};
async function get<T>(url: string, signal: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal });
  if (!r.ok) throw Error("Không tải được dữ liệu bản đồ. Vui lòng thử lại.");
  return r.json();
}
function LocationInfo({
  location,
  industry,
  onJob,
  compact = false,
  mode,
}: {
  location: Location;
  industry: string;
  onJob: (id: number) => void;
  compact?: boolean;
  mode: string;
}) {
  const data = useResource("location:" + industry + location.key, (s) =>
    get<Detail>(
      "/api/market/location?" +
        new URLSearchParams({ key: location.key, industry }),
      s,
    ),
  );
  return (
    <div className="location-info">
      <h3>{location.label}</h3>
      <strong>{number(location.count)} tin tuyển dụng</strong>
      <DataState {...data}>
        {mode !== "industries" && (
          <>
            <h4>Kỹ năng nổi bật</h4>
            <p className="source">
              Trong {data.data?.skillsSampleSize} tin được đọc chi tiết. Nhãn
              đồng nghĩa dùng số tin của một nhãn nguồn đại diện.
            </p>
            {data.data?.skills === null ? (
              <p>Chưa tải đủ dữ liệu kỹ năng.</p>
            ) : (
              <div className="chips">
                {!visibleEntities(
                  data.data?.skills || [],
                  (s) => s.name,
                  "skill",
                ).length && (
                  <p>Chưa có kỹ năng đã xác minh trong mẫu tin này.</p>
                )}
                {visibleEntities(
                  data.data?.skills || [],
                  (s) => s.name,
                  "skill",
                )
                  .slice(0, compact ? 3 : 5)
                  .map((s) => (
                    <span key={s.name} className="chip">
                      {formatSkillLabel(s.name)} · {s.count}
                    </span>
                  ))}
              </div>
            )}
          </>
        )}
        {mode !== "skills" && (
          <>
            <h4>{mode === "industries" ? "Theo ngành" : "Nghề nổi bật"}</h4>
            <ul className="ranking">
              {(mode === "industries"
                ? data.data?.industries
                : visibleEntities(
                    data.data?.occupations || [],
                    (s) => s.name,
                    "occupation",
                  )
              )
                ?.slice(0, compact ? 2 : 5)
                .map((r) => (
                  <li key={r.name}>
                    <span>
                      {mode === "industries"
                        ? industryName(r.name)
                        : formatOccupationLabel(r.name)}
                    </span>
                    <b>{r.count} tin</b>
                  </li>
                ))}
            </ul>
          </>
        )}
        {!compact && (
          <>
            <h4>Tin tuyển dụng</h4>
            <div className="match-list">
              {data.data?.jobs.map((j) => (
                <button key={j.job_id} onClick={() => onJob(j.job_id)}>
                  {formatOccupationLabel(j.job_title)}
                  <span>→</span>
                </button>
              ))}
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
export function MarketGeography({
  industry,
  compact = false,
}: {
  industry: Industry;
  compact?: boolean;
}) {
  const [scope, setScope] = useState("");
  const [mode, setMode] = useState("jobs");
  const data = useResource("geo:" + scope, (s) =>
    get<{ locations: Location[]; total: number }>(
      "/api/market/geography?" + new URLSearchParams({ industry: scope }),
      s,
    ),
  );
  const [hover, setHover] = useState<Location>();
  const [selected, setSelected] = useState<Location>();
  const [job, setJob] = useState<number>();
  const max = Math.max(1, ...(data.data?.locations || []).map((l) => l.count));
  const labels = [...(data.data?.locations || [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((l) => l.key);
  return (
    <section className="market-map-module">
      {!compact && (
        <>
          <SectionTitle
            title="Bản đồ thị trường lao động"
            subtitle="Cơ hội tuyển dụng theo khu vực"
          />
        </>
      )}
      <div className="map-filter-row">
        <label>
          <span className="sr-only">Phạm vi bản đồ</span>
          <select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setHover(undefined);
            }}
          >
            <option value="">Toàn quốc</option>
            <option value={industry}>Ngành đang xem</option>
          </select>
        </label>
        <div className="segments">
          {[
            ["jobs", "Việc làm"],
            ["skills", "Kỹ năng"],
            ["industries", "Ngành"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={mode === id ? "selected" : ""}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <DataState {...data} empty={data.data?.locations.length === 0}>
        <div
          className="vietnam-geography"
          onMouseLeave={() => setHover(undefined)}
        >
          <svg
            viewBox="0 0 540 620"
            aria-label="Bản đồ địa lý Việt Nam và số tin tuyển dụng"
          >
            <defs>
              <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#dfd1f2" />
                <stop offset="1" stopColor="#f1e6fa" />
              </linearGradient>
            </defs>
            <g className="vietnam-land">
              {geo.paths.map((path, i) => (
                <path d={path || ""} key={i} fill="url(#land)" />
              ))}
            </g>
            {[...(data.data?.locations || [])]
              .sort((a, b) => b.count - a.count)
              .map((l) => {
                const r = 5 + Math.sqrt(l.count / max) * 14;
                const isMajor = labels.includes(l.key);
                return (
                  <g
                    key={l.key}
                    role="button"
                    tabIndex={0}
                    aria-label={`${l.label}: ${l.count} tin tuyển dụng`}
                    className="geo-bubble"
                    onMouseEnter={() => setHover(l)}
                    onFocus={() => setHover(l)}
                    onClick={() => {
                      setSelected(l);
                      setHover(undefined);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(l);
                      }
                    }}
                  >
                    <circle
                      cx={l.x}
                      cy={l.y}
                      r={r + 5}
                      fill={l.count / max > 0.6 ? "#ff6b4a22" : "#8127cf15"}
                    />
                    <circle
                      cx={l.x}
                      cy={l.y}
                      r={r}
                      fill={l.count / max > 0.6 ? "#ef775e" : "#8753c4"}
                      fillOpacity=".9"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <title>
                      {l.label}: {l.count} tin tuyển dụng
                    </title>
                  </g>
                );
              })}
            {data.data?.locations
              .filter((l) => labels.includes(l.key))
              .map((l) => (
                <g
                  key={"label-" + l.key}
                  className="geo-label"
                  pointerEvents="none"
                >
                  <text x={l.x + 40} y={l.y - 6}>
                    {l.label}
                  </text>
                  <text className="geo-count" x={l.x + 40} y={l.y + 11}>
                    {number(l.count)} tin
                  </text>
                </g>
              ))}
          </svg>
          <div className="geo-legend">
            <i />
            Kích thước điểm biểu thị số tin
          </div>
          {hover && (
            <div className="geo-tooltip" role="tooltip">
              <LocationInfo
                location={hover}
                industry={scope}
                mode={mode}
                compact
                onJob={setJob}
              />
              <small>Nhấp vào điểm để xem chi tiết</small>
            </div>
          )}
        </div>
        <label className="location-picker">
          Xem chi tiết địa điểm
          <select
            aria-label="Chọn địa điểm"
            value=""
            onChange={(e) =>
              setSelected(
                data.data?.locations.find((l) => l.key === e.target.value),
              )
            }
          >
            <option value="">Chọn tỉnh / thành phố</option>
            {data.data?.locations.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label} · {number(l.count)} tin
              </option>
            ))}
          </select>
        </label>
        <p className="source">
          Dữ liệu được tổng hợp từ các tin tuyển dụng trong hệ thống. Một tin có
          thể đề cập nhiều địa điểm.
        </p>
      </DataState>
      {selected && job === undefined && (
        <Sheet title={selected.label} onClose={() => setSelected(undefined)}>
          <LocationInfo
            location={selected}
            industry={scope}
            mode={mode}
            onJob={setJob}
          />
        </Sheet>
      )}
      {job !== undefined && (
        <JobSheet
          id={job}
          onClose={() => {
            setJob(undefined);
            setSelected(undefined);
          }}
        />
      )}
    </section>
  );
}
