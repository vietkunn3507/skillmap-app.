"use client";
import { GrowthRanking } from "./growth-ranking";
import { useState } from "react";
import { TrendChart } from "./trend-chart";
import { SearchableSelect } from "./searchable-select";
import { formatSkillLabel } from "@/lib/taxonomy";
import { MarketGeography } from "./market-geography";
import { api } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import type { Industry } from "@/lib/types";
import { number, industryName, splitMacro } from "@/lib/format";
import { DataState, SectionTitle } from "./ui";
export function MarketPanel({ industry, showGrowth = true }: { industry: Industry; showGrowth?: boolean }) {
  const overview = useResource("overview", api.overview);
  const trends = useResource("trend:" + industry, (s) =>
    api.trend(industry, s),
  );
  const [skill, setSkill] = useState("");
  const [direction, setDirection] = useState("rising");
  const gradient = useResource("gradient:" + industry + direction, (s) =>
    api.gradient(industry, direction, s),
  );
  const macro = useResource("macro", api.macro);
  const [level, setLevel] = useState("Skill levels 3 and 4 ~ high");
  const selected =
    trends.data?.skills.find((s) => s.skill === skill) ||
    trends.data?.skills[0];
  return (
    <div className="analytics-grid">
      {showGrowth && <GrowthRanking industry={industry}/>}
      <nav className="analytics-jump" aria-label="Phân tích dữ liệu">
        {showGrowth && <a href="#emerging-skills">Kỹ năng tăng / giảm nhanh</a>}
        <a href="#skill-trends">Xu hướng theo năm</a>
        <a href="#skill-gradient">SGI · Kinh nghiệm</a>
        <a href="#ilostat">ILOSTAT · Toàn quốc</a>
      </nav>
      <section>
        <SectionTitle
          title="Thị trường Việt Nam"
          subtitle="Phân bổ cơ hội trong bộ dữ liệu"
        />
        <DataState {...overview}>
          <div className="card">
            <div className="metric-grid">
              <div>
                <strong>{number(overview.data?.total_jobs || 0)}</strong>
                <span>Tin tuyển dụng</span>
              </div>
              <div>
                <strong>{number(overview.data?.total_skills || 0)}</strong>
                <span>Nhãn kỹ năng nguồn</span>
              </div>
            </div>
            {overview.data?.by_industry.map((r) => (
              <div className="bar-row" key={r.industry}>
                <div>
                  <span>{industryName(r.industry)}</span>
                  <b>{number(r.n)} tin</b>
                </div>
                <div className="bar-track">
                  <i
                    style={{
                      width: `${(r.n / Math.max(1, overview.data!.total_jobs)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <p className="source">
              {overview.data?.data_source}. Các tin lịch sử có thể đã hết hạn.
            </p>
          </div>
        </DataState>
      </section>
      <MarketGeography industry={industry} />
      <section id="skill-trends">
        <SectionTitle
          title="Xu hướng kỹ năng theo năm"
          subtitle="Tỷ lệ tin tuyển dụng đề cập đến kỹ năng này"
        />
        <DataState {...trends} empty={!trends.data?.skills.length}>
          <div className="card">
            <SearchableSelect
              label="Kỹ năng"
              value={selected?.skill || ""}
              options={(trends.data?.skills || []).map((s) => ({
                value: s.skill,
                label: formatSkillLabel(s.skill),
              }))}
              onChange={setSkill}
            />
            {selected && (
              <TrendChart
                series={selected.series}
                label={formatSkillLabel(selected.skill)}
              />
            )}
            <p className="source">
              Nguồn: dữ liệu tuyển dụng {industryName(industry)}. Không phải dự
              báo tăng trưởng. Nhãn đồng nghĩa dùng một chuỗi nguồn đại diện,
              không cộng gộp.
            </p>
          </div>
        </DataState>
      </section>
      <section id="skill-gradient">
        <SectionTitle
          title="SGI · Kỹ năng theo kinh nghiệm"
          subtitle="So sánh nhóm 0–3 năm và trên 3 năm"
        />
        <div className="segments">
          <button
            className={direction === "rising" ? "selected" : ""}
            onClick={() => setDirection("rising")}
          >
            Nghiêng về người mới
          </button>
          <button
            className={direction === "falling" ? "selected" : ""}
            onClick={() => setDirection("falling")}
          >
            Nghiêng về lâu năm
          </button>
        </div>
        <DataState {...gradient} empty={gradient.data?.skills.length === 0}>
          <div className="card">
            <p className="source">
              Nguồn: VietJobs. SGI được API lưu ở trường SEI: tỷ trọng nhóm 0–3
              năm / tỷ trọng nhóm trên 3 năm. Lớn hơn 1 nghiêng về người mới,
              nhỏ hơn 1 nghiêng về lâu năm; không phải tăng trưởng theo năm.
              Nhãn nguồn đã được chuẩn hóa, không cộng số liệu giữa các nhãn
              đồng nghĩa.
            </p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Kỹ năng</th>
                    <th>0–3 năm</th>
                    <th>&gt;3 năm</th>
                    <th>SGI (SEI)</th>
                  </tr>
                </thead>
                <tbody>
                  {gradient.data?.skills.map((s) => (
                    <tr key={s.skill}>
                      <td>{formatSkillLabel(s.skill)}</td>
                      <td>{number(s.share_junior)}%</td>
                      <td>{number(s.share_senior)}%</td>
                      <td>{number(s.SEI)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DataState>
      </section>
      <section id="ilostat">
        <SectionTitle
          title="ILOSTAT · Cơ cấu kỹ năng toàn quốc"
          subtitle="Tỷ trọng việc làm · ILOSTAT"
        />
        <DataState {...macro} empty={macro.data?.rows.length === 0}>
          <div className="card">
            <label>
              Cấp độ kỹ năng
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="Skill level 1 ~ low">Cấp 1 — Thấp</option>
                <option value="Skill level 2 ~ medium">
                  Cấp 2 — Trung bình
                </option>
                <option value="Skill levels 3 and 4 ~ high">
                  Cấp 3 & 4 — Cao
                </option>
              </select>
            </label>
            <p className="warning">
              Thay đổi phương pháp thống kê năm 2021 (ICLS). Không nối hoặc nội
              suy qua mốc 2020–2021.
            </p>
            {splitMacro(
              (macro.data?.rows || []).filter((r) => r.skill_level === level),
            ).map((rows, i) => (
              <div key={i}>
                <h3>{i === 0 ? "Trước năm 2021" : "Từ năm 2021"}</h3>
                <TrendChart
                  metric="employment"
                  series={rows}
                  label={
                    level.includes("1 ~")
                      ? "Kỹ năng thấp"
                      : level.includes("2 ~")
                        ? "Kỹ năng trung bình"
                        : "Kỹ năng cao"
                  }
                />
              </div>
            ))}
          </div>
        </DataState>
      </section>
    </div>
  );
}
