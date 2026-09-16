"use client";
import Link from "next/link";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Mapi } from "@/components/mapi/mascot";
import { HomeMapiInsight } from "@/components/mapi/home-insight";
import { AskMapi } from "@/components/mapi/ask-mapi";
import { useState } from "react";
import { ArrowRight, Check, Bookmark, Flag } from "lucide-react";
import { useProfile } from "@/components/profile-provider";
import { CareerMap } from "@/components/career-map";
import { DataState, SectionTitle, Sheet, DemoNotice } from "@/components/ui";
import { api } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { personalMatches } from "@/lib/personal";
import { number, industryName } from "@/lib/format";
import { formatSkillLabel, formatOccupationLabel } from "@/lib/taxonomy";
import { demoGaps } from "@/lib/profile-data";
import type { CareerMatch } from "@/lib/types";
export default function Home() {
  const { profile, update } = useProfile();
  const [selected, setSelected] = useState<CareerMatch>();
  const overview = useResource("overview", api.overview);
  const matches = useResource(
    "matches:" + profile.demo + JSON.stringify(profile.skills),
    (s) => personalMatches(profile, s),
  );
  const top = useResource("top:" + profile.industry, (s) =>
    api.top(profile.industry, s),
  );
  return (
    <div className="dashboard-grid">
      <section className="greeting dashboard-greeting home-personal-greeting">
        <div>
          <div className="home-name-row">
            <h1>Chào {profile.name || "bạn"} 👋</h1>
            <Link href="/profile" aria-label="Hồ sơ của bạn">
              <ProfileAvatar name={profile.name} size={45} />
            </Link>
          </div>
          <h2>
            {profile.demo
              ? "Financial Analyst đang gần bạn nhất."
              : profile.target
                ? `Cùng hướng tới ${formatOccupationLabel(profile.target)}.`
                : "Bắt đầu từ kỹ năng bạn đang có."}
          </h2>
          {profile.demo && (
            <>
              <p>82% phù hợp với hồ sơ hiện tại</p>
              <span className="mapi-demo-label">
                Độ phù hợp mẫu · Hồ sơ demo
              </span>
            </>
          )}
        </div>
        <div className="home-mapi-greeting">
          <Mapi state="greeting" size={86} />
          <p>
            {profile.target
              ? "Cùng mình xem bước tiếp theo nhé."
              : "Mình sẵn sàng cùng bạn tạo bản đồ."}
          </p>
        </div>
      </section>
      <section className="dashboard-map">
        <DataState {...matches}>
          <CareerMap
            name={profile.name}
            skills={
              profile.demo
                ? ["Excel", "Power BI", "Accounting", "SQL"]
                : profile.skills
            }
            missingSkill={profile.demo ? "SQL" : undefined}
            nodes={(matches.data?.matches || []).slice(0, 3).map((m) => ({
              title: formatOccupationLabel(m.job_title),
              label: m.demo ? `${m.fit}%` : `${m.matched_skills} kỹ năng`,
            }))}
            onSelect={(i) => setSelected(matches.data?.matches[i])}
          />
        </DataState>
        <HomeMapiInsight />
      </section>
      <section className="dashboard-market">
        <SectionTitle
          title="Tổng quan thị trường"
          action={
            <Link href="/explore?tab=market" className="text-link">
              Xu hướng · SGI · ILOSTAT →
            </Link>
          }
        />
        <DataState {...overview}>
          <div className="card market-summary">
            <span className="eyebrow">TIN TUYỂN DỤNG TRONG HỆ THỐNG</span>
            <strong className="big-number">
              {number(overview.data?.total_jobs || 0)}
            </strong>
            <div className="summary-row">
              <span>{number(overview.data?.total_skills || 0)} kỹ năng</span>
              <span>Dữ liệu thực tế</span>
            </div>
            <p className="source">
              Nguồn: {overview.data?.data_source}. Tin lịch sử có thể đã hết
              hạn.
            </p>
          </div>
        </DataState>
      </section>
      <section>
        <SectionTitle
          title="Kỹ năng nổi bật"
          subtitle={industryName(profile.industry)}
        />
        <DataState {...top} empty={top.data?.skills.length === 0}>
          <div className="card skill-list">
            {top.data?.skills.slice(0, 4).map((s) => (
              <Link href="/explore?tab=skills" key={s.skill_display}>
                <span>{formatSkillLabel(s.skill_display)}</span>
                <strong>
                  {number(s.n_jobs)} tin <ArrowRight size={14} />
                </strong>
              </Link>
            ))}
          </div>
        </DataState>
      </section>
      <section className="dashboard-next stack">
        <div className="card">
          <SectionTitle title="Đích đến của bạn" />
          <h2>
            {formatOccupationLabel(profile.target || "Chưa chọn nghề mục tiêu")}
          </h2>
          <p className="source">Kỹ năng và kế hoạch của riêng bạn.</p>
          <div className="chips">
            {profile.skills.slice(0, 5).map((s) => (
              <span key={s} className="chip">
                <Check size={13} />
                {formatSkillLabel(s)}
              </span>
            ))}
          </div>
          <Link className="text-link" href="/profile">
            Xem hồ sơ →
          </Link>
          <h4>Kế hoạch học</h4>
          <ol className="task-list">
            {profile.plan.map((s) => (
              <li key={s}>{formatSkillLabel(s)}</li>
            ))}
          </ol>
          <Link className="button secondary full" href="/map?tab=map">
            Xem lộ trình
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      {selected && (
        <Sheet
          title={formatOccupationLabel(selected.job_title)}
          onClose={() => setSelected(undefined)}
        >
          {selected.demo ? (
            <>
              <DemoNotice>
                Độ phù hợp và khoảng cách kỹ năng của hồ sơ demo Phương.
              </DemoNotice>
              <h2 className="spaced">{selected.fit}% phù hợp</h2>
              {selected.job_title === "Financial Analyst" && (
                <>
                  <h4>Kỹ năng đã có</h4>
                  <div className="chips">
                    {["Excel", "Power BI", "Accounting", "English"].map((s) => (
                      <span className="chip" key={s}>
                        <Check size={14} />
                        {s}
                      </span>
                    ))}
                  </div>
                  <h4>Bạn còn thiếu gì?</h4>
                  {demoGaps.map((g) => (
                    <div className="skill-row" key={g.skill}>
                      <span>{g.skill}</span>
                      <span className="badge">{g.priority}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              <h3>{selected.matched_skills} kỹ năng trùng khớp</h3>
              <p>
                {selected.n_similar_jobs} tin tương tự. Đây là kết quả đối chiếu
                kỹ năng, không phải xác suất trúng tuyển.
              </p>
            </>
          )}
          <AskMapi
            question="Vì sao tôi phù hợp nghề này?"
            context={{ kind: "career", value: selected.job_title }}
            onClick={() => setSelected(undefined)}
          />
          <button
            className="button full"
            onClick={() => {
              update({ target: selected.job_title });
              setSelected(undefined);
            }}
          >
            <Flag size={16} />
            Chọn làm mục tiêu
          </button>
          <button
            className="button secondary full"
            disabled={profile.savedOccupations.includes(selected.job_title)}
            onClick={() =>
              update({
                savedOccupations: [
                  ...profile.savedOccupations,
                  selected.job_title,
                ],
              })
            }
          >
            <Bookmark size={16} />
            {profile.savedOccupations.includes(selected.job_title)
              ? "Đã lưu nghề"
              : "Lưu nghề"}
          </button>
          <Link href="/map?tab=map" className="button secondary full">
            Xem lộ trình →
          </Link>
        </Sheet>
      )}
    </div>
  );
}
