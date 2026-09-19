"use client";
import { IntelligenceLinks } from "@/components/intelligence-links";
import {
  formatSkillLabel,
  formatOccupationLabel,
  formatLocationLabel,
} from "@/lib/taxonomy";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Plus, ArrowRight } from "lucide-react";
import { useProfile } from "@/components/profile-provider";
import { DataState, SectionTitle } from "@/components/ui";
import { JobCard, JobSheet } from "@/components/jobs";
import { MarketPanel } from "@/components/market-panel";
import { OccupationSkills } from "@/components/occupation-skills";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";
import { number, sameSkill } from "@/lib/format";
import type { Industry } from "@/lib/types";
function ExploreContent() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") || "all";
  const { profile, update } = useProfile();
  const [industry, setIndustry] = useState<Industry>(profile.industry);
  const [year, setYear] = useState("");
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(false);
  const [selected, setSelected] = useState<number>();
  const top = useResource("top:" + industry, (s) => api.top(industry, s));
  const jobs = useResource("jobs:" + industry + year + offset, (s) =>
    api.jobs(
      { industry, year: year ? Number(year) : undefined, offset, limit: 12 },
      s,
    ),
  );
  const overview = useResource("overview", api.overview);
  const list = (jobs.data?.jobs || []).filter((j) =>
    `${j.job_title} ${j.company_name} ${j.location}`
      .toLocaleLowerCase("vi")
      .includes(search.toLocaleLowerCase("vi")),
  );
  const skills = (top.data?.skills || []).filter((s) =>
    `${s.skill_display} ${formatSkillLabel(s.skill_display)}`
      .toLocaleLowerCase("vi")
      .includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <div className="stack">
      <IntelligenceLinks/>
      <section className="greeting">
        
        <h1>Khám phá nghề & thị trường</h1>
      </section>
      <div className="search-row">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Tìm trên trang hiện tại"
            placeholder="Tìm nghề, công ty, kỹ năng…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button
          aria-label="Bộ lọc"
          aria-expanded={filters}
          className="icon-button filter-button"
          onClick={() => setFilters((f) => !f)}
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>
      <div className="tabs" role="tablist" aria-label="Nội dung khám phá">
        {[
          ["all", "Tất cả"],
          ["jobs", "Nghề"],
          ["skills", "Kỹ năng"],
          ["market", "Thị trường"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "selected" : ""}
            onClick={() => router.replace("/explore?tab=" + id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={filters ? "filters open" : "filters"}>
        <label>
          Ngành
          <select
            value={industry}
            onChange={(e) => {
              setIndustry(e.target.value as Industry);
              setOffset(0);
            }}
          >
            <option value="it_data">IT & Dữ liệu</option>
            <option value="ke_toan_tai_chinh">Tài chính & Kế toán</option>
          </select>
        </label>
        {filters && (
          <label>
            Năm đăng tin
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setOffset(0);
              }}
            >
              <option value="">Tất cả các năm</option>
              {[
                ...new Set(
                  overview.data?.by_year_industry.map((r) => r.year) || [],
                ),
              ]
                .sort()
                .reverse()
                .map((y) => (
                  <option key={y}>{y}</option>
                ))}
            </select>
          </label>
        )}
      </div>
      {tab === "all" && (
        <button
          className="explore-banner"
          onClick={() => router.replace("/explore?tab=market")}
        >
          <img src="/images/office.png" alt="" />
          <div>
            <span className="badge">TIÊU ĐIỂM · DỮ LIỆU TUYỂN DỤNG</span>
            <h2>
              Xu hướng tuyển dụng
              <br />
              Tech & Finance
            </h2>
            <p>Khám phá kỹ năng và cơ hội trong dữ liệu thực tế.</p>
            <strong>
              Xem thị trường <ArrowRight size={16} />
            </strong>
          </div>
        </button>
      )}
      {(tab === "all" || tab === "jobs") && (
        <section>
          <SectionTitle
            title="Cơ hội nghề nghiệp"
            subtitle="Tin tuyển dụng từ bộ dữ liệu TopCV"
          />
          <p className="source">
            Tìm kiếm trong 12 tin trên trang này.
          </p>
          <DataState {...jobs} empty={list.length === 0}>
            <div className="job-grid">
              {list.map((job) => (
                <JobCard
                  key={job.job_id}
                  job={job}
                  onOpen={() => setSelected(job.job_id)}
                />
              ))}
            </div>
          </DataState>
          <div className="pagination">
            <button
              className="button secondary"
              disabled={offset === 0 || jobs.loading}
              onClick={() => {
                setOffset((o) => Math.max(0, o - 12));
                setSearch("");
              }}
            >
              Trang trước
            </button>
            <span>Trang {offset / 12 + 1}</span>
            <button
              className="button secondary"
              disabled={
                jobs.loading ||
                !!jobs.error ||
                (jobs.data?.jobs.length || 0) < 12
              }
              onClick={() => {
                setOffset((o) => o + 12);
                setSearch("");
              }}
            >
              Trang sau
            </button>
          </div>
        </section>
      )}
      {(tab === "all" || tab === "skills") && (
        <>
          <OccupationSkills />
          <section>
            <SectionTitle
              title="Kỹ năng phổ biến"
              subtitle="Số tin nhắc đến từng kỹ năng"
            />
            <p className="source">
              Chỉ hiển thị nhãn đã qua kiểm tra. Nhãn đồng nghĩa được gộp; số
              tin giữ theo nhãn nguồn đại diện, không cộng để tránh đếm trùng.
            </p>
            <DataState {...top} empty={skills.length === 0}>
              <div className="card skill-list">
                {skills.map((skill) => {
                  const has = profile.skills.some((s) =>
                    sameSkill(s, skill.skill_display),
                  );
                  const planned = profile.plan.includes(skill.skill_display);
                  return (
                    <div
                      className="skill-row popular-skill-row"
                      key={formatSkillLabel(skill.skill_display)}
                    >
                      <div>
                        <h3>{formatSkillLabel(skill.skill_display)}</h3>
                        <p>{number(skill.n_jobs)} tin tuyển dụng</p>
                      </div>
                      <button
                        className="chip"
                        aria-label={`Lưu kỹ năng ${formatSkillLabel(skill.skill_display)}`}
                        aria-pressed={profile.savedSkills.includes(skill.skill_display)}
                        onClick={() =>
                          update({
                            savedSkills: profile.savedSkills.includes(
                              skill.skill_display,
                            )
                              ? profile.savedSkills.filter(
                                  (s) => s !== skill.skill_display,
                                )
                              : [...profile.savedSkills, skill.skill_display],
                          })
                        }
                      >
                        {profile.savedSkills.includes(skill.skill_display)
                          ? "Đã lưu"
                          : "Lưu kỹ năng"}
                      </button>
                      <button
                        className="chip"
                        disabled={has || planned}
                        onClick={() =>
                          update({
                            plan: [...profile.plan, skill.skill_display],
                          })
                        }
                      >
                        {has ? (
                          "Đã có"
                        ) : planned ? (
                          "Trong kế hoạch"
                        ) : (
                          <>
                            <Plus size={14} />
                            Kế hoạch
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </DataState>
          </section>
        </>
      )}
      {tab === "market" && <MarketPanel industry={industry} />}
      {selected !== undefined && (
        <JobSheet id={selected} onClose={() => setSelected(undefined)} />
      )}
    </div>
  );
}
export default function Explore() {
  return (
    <Suspense fallback={<div className="state">Đang tải…</div>}>
      <ExploreContent />
    </Suspense>
  );
}
