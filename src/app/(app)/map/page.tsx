"use client";
import { IntelligenceLinks } from "@/components/intelligence-links";
import {
  visibleEntities,
  visibleSkills,
  normalizeEntity,
} from "@/lib/taxonomy";
import { MarketGeography } from "@/components/market-geography";
import { AskMapi } from "@/components/mapi/ask-mapi";
import { personalMatches } from "@/lib/personal";
import { demoGaps } from "@/lib/profile-data";
import { formatSkillLabel, formatOccupationLabel } from "@/lib/taxonomy";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Check, Plus, Flag, ArrowRight, Trash2 } from "lucide-react";
import { useProfile } from "@/components/profile-provider";
import { CareerMap } from "@/components/career-map";
import { DataState, SectionTitle, Sheet } from "@/components/ui";
import { api } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { industryName, sameSkill } from "@/lib/format";
import type { CareerMatch } from "@/lib/types";
function MapContent() {
  const params = useSearchParams();
  const { profile, update, ready } = useProfile();
  const [tab, setTab] = useState(params.get("tab") || "market");
  useEffect(() => {
    const t = params.get("tab");
    if (t && ["market", "map", "skills", "tasks", "plan"].includes(t))
      setTab(t);
  }, [params]);
  const trial = profile.whatIf;
  const setTrial = (value: string | ((old: string) => string)) =>
    update({
      whatIf: typeof value === "function" ? value(profile.whatIf) : value,
    });
  const [selected, setSelected] = useState<CareerMatch>();
  const [custom, setCustom] = useState("");
  const current = useResource("match:" + JSON.stringify(profile.skills), (s) =>
    personalMatches(profile, s),
  );
  const simulated = useResource(
    "whatif:" + JSON.stringify(profile.skills) + trial,
    (s) =>
      trial
        ? api.match([...profile.skills, trial], s)
        : Promise.resolve({ matches: [], input_skills: [] }),
  );
  const top = useResource("top:" + profile.industry, (s) =>
    api.top(profile.industry, s),
  );
  const displayed = trial ? simulated : current;
  const options = (top.data?.skills || [])
    .filter((s) => !profile.skills.some((p) => sameSkill(p, s.skill_display)))
    .slice(0, 5);
  const addPlan = (skill: string) => {
    if (
      normalizeEntity(skill, "skill") &&
      !profile.plan.some((p) => sameSkill(p, skill))
    )
      update({ plan: [...profile.plan, skill] });
  };
  return (
    <div className="stack">
      <IntelligenceLinks/>
      <section className="greeting">
        <h1>Bản đồ nghề nghiệp, kỹ năng &amp; nhiệm vụ Việt Nam</h1>
        {profile.demo && tab !== "market" && (
          <span className="badge">Hồ sơ và độ phù hợp: dữ liệu demo</span>
        )}
      </section>
      <div className="tabs map-section-tabs">
        {[
          ["market", "Việt Nam"],
          ["map", "Nghề"],
          ["skills", "Kỹ năng"],
          ["tasks", "Nhiệm vụ"],
          ["plan", "Lộ trình"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "selected" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "market" && (
        <>
          <MarketGeography industry={profile.industry} compact />
          <section className="card map-purpose">
            <h2>Từ thị trường đến hành trình của bạn</h2>
            <p>
              Chọn một địa điểm để xem nghề và kỹ năng trong dữ liệu tuyển dụng.
              Hoặc xem những kỹ năng kết nối với mục tiêu của bạn.
            </p>
            <button
              className="button secondary full"
              onClick={() => setTab("map")}
            >
              Xem bản đồ nghề của tôi
              <ArrowRight size={16} />
            </button>
          </section>
        </>
      )}
      {tab === "tasks" && (
        <section className="card">
          <SectionTitle
            title="Nhiệm vụ & kỹ năng của bạn"
            subtitle="Những việc bạn đã thực hiện trong hồ sơ"
          />
          {visibleEntities(profile.tasks, (s) => s, "task").length ? (
            <ul className="task-connections">
              {visibleEntities(profile.tasks, (s) => s, "task").map((task) => (
                <li key={task}>
                  <span>{formatSkillLabel(task)}</span>
                  <small>
                    {profile.demo ? "Theo hồ sơ demo" : "Từ hồ sơ cá nhân"}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              Hồ sơ chưa có nhiệm vụ. Bạn có thể bổ sung thông tin trong CV.
            </p>
          )}
          <h4>Kỹ năng hiện có</h4>
          <div className="chips">
            {visibleSkills(profile.skills).map((s) => (
              <span className="chip" key={s}>
                {formatSkillLabel(s)}
              </span>
            ))}
          </div>
          <p className="source">
            Chưa có dữ liệu xác minh quan hệ giữa từng nhiệm vụ và kỹ năng. Danh
            sách này phản ánh hồ sơ cá nhân.
          </p>
          <Link className="button secondary full" href="/profile#cv">
            Xem CV & hồ sơ
          </Link>
        </section>
      )}
      {tab === "map" && (
        <>
          <DataState {...displayed} loading={!ready || displayed.loading}>
            <CareerMap
              name={profile.name}
              nodes={(displayed.data?.matches || []).slice(0, 3).map((m) => ({
                title: formatOccupationLabel(m.job_title),
                label: m.demo ? `${m.fit}%` : `${m.matched_skills} kỹ năng`,
              }))}
              skills={
                profile.demo && !trial
                  ? ["Excel", "Power BI", "Accounting", "SQL"]
                  : [...profile.skills, ...(trial ? [trial] : [])]
              }
              missingSkill={profile.demo ? "SQL" : undefined}
              interactive
              onSelect={(i) => setSelected(displayed.data?.matches[i])}
            />
          </DataState>
          <p className="source">
            Nghề gợi ý dựa trên dữ liệu đối chiếu kỹ năng. Thứ tự trình bày không thể hiện thời gian học hay cam kết tuyển dụng.
          </p>
          <section className="card what-if">
            <SectionTitle
              title="Bộ giả lập What-If"
              subtitle="Nếu tôi học thêm…"
            />
            <div className="chips">
              {options.map((s) => (
                <button
                  className={
                    trial === s.skill_display ? "chip selected" : "chip"
                  }
                  key={formatSkillLabel(s.skill_display)}
                  onClick={() =>
                    setTrial((t) =>
                      t === s.skill_display ? "" : s.skill_display,
                    )
                  }
                >
                  <Plus size={14} />
                  {formatSkillLabel(s.skill_display)}
                </button>
              ))}
            </div>
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  custom.trim() &&
                  !!normalizeEntity(custom, "skill") &&
                  !profile.skills.some((s) => sameSkill(s, custom))
                )
                  setTrial(custom.trim());
              }}
            >
              <input
                aria-label="Kỹ năng muốn thử"
                placeholder="Thử một kỹ năng khác"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
              <button
                className="button secondary"
                disabled={!normalizeEntity(custom, "skill")}
              >
                Thử
              </button>
            </form>
            {custom.trim() && !normalizeEntity(custom, "skill") && (
              <p className="source" role="status">
                Kỹ năng này chưa được xác minh. Hãy chọn một kỹ năng gợi ý.
              </p>
            )}
            {trial && (
              <>
                <p>
                  Đang thử thêm: <strong>{trial}</strong>{" "}
                  <button className="text-link" onClick={() => setTrial("")}>
                    Đặt lại
                  </button>
                </p>
                <DataState
                  {...simulated}
                  empty={simulated.data?.matches.length === 0}
                >
                  <p>
                    Kết quả truy vấn:{" "}
                    <strong>
                      {simulated.data?.matches.length || 0} nhóm nghề
                    </strong>
                    . Đây là số nhóm tìm thấy trong dữ liệu, không phải toàn bộ
                    nghề có thể tiếp cận.
                  </p>
                  <div className="match-list">
                    {simulated.data?.matches.slice(0, 3).map((m, i) => (
                      <button
                        key={m.job_title + i}
                        onClick={() => setSelected(m)}
                      >
                        <span>{formatOccupationLabel(m.job_title)}</span>
                        <strong>{m.matched_skills} kỹ năng khớp</strong>
                      </button>
                    ))}
                  </div>
                </DataState>
                <button
                  className="button full"
                  disabled={profile.plan.includes(trial)}
                  onClick={() => addPlan(trial)}
                >
                  {profile.plan.includes(trial)
                    ? "Đã thêm vào lộ trình"
                    : `Thêm ${trial} vào lộ trình`}
                </button>
              </>
            )}
            <p className="source">
              Truy vấn lại dữ liệu với kỹ năng giả định; không dự đoán điểm phù
              hợp, thu nhập hay xác suất trúng tuyển.
            </p>
          </section>
          <section>
            <SectionTitle title="Những nghề liên quan đến bạn" />
            <DataState {...current} empty={current.data?.matches.length === 0}>
              <div className="card match-list">
                {current.data?.matches.map((m, i) => (
                  <button key={m.job_title + i} onClick={() => setSelected(m)}>
                    <div>
                      <h3>{formatOccupationLabel(m.job_title)}</h3>
                      <p>
                        {m.demo
                          ? `${m.fit}% phù hợp · dữ liệu demo`
                          : `${m.matched_skills} kỹ năng khớp · ${m.n_similar_jobs} tin tương tự`}
                      </p>
                    </div>
                    <ArrowRight size={18} />
                  </button>
                ))}
              </div>
            </DataState>
            {!profile.skills.length && (
              <Link href="/profile" className="button full">
                Thêm kỹ năng vào hồ sơ
              </Link>
            )}
          </section>
        </>
      )}
      {tab === "skills" && (
        <section className="card">
          <SectionTitle
            title="Nền tảng kỹ năng của bạn"
            subtitle="Kỹ năng trong hồ sơ của bạn"
          />
          <div className="chips">
            {visibleSkills(profile.skills).map((s) => (
              <span className="chip" key={s}>
                <Check size={14} />
                {formatSkillLabel(s)}
              </span>
            ))}
          </div>
          {!visibleSkills(profile.skills).length && (
            <p>Bạn chưa thêm kỹ năng.</p>
          )}
          <Link className="button secondary full" href="/profile">
            Chỉnh sửa kỹ năng
          </Link>
        </section>
      )}
      {tab === "plan" && (
        <section>
          <SectionTitle
            title="Kế hoạch học cá nhân"
            subtitle={profile.target || "Chọn một nghề làm mục tiêu để bắt đầu"}
          />
          <div className="card">
            <span className="badge">LỘ TRÌNH CỦA BẠN</span>
            <p>
              Đây là kế hoạch học đã lưu của bạn. Mở công cụ Chuyển nghề ở đầu trang để tìm đường qua nghề trung gian, hoặc Đầu tư kỹ năng để xem thứ tự ưu tiên từ dữ liệu.
            </p>
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                addPlan(custom.trim());
                setCustom("");
              }}
            >
              <input
                aria-label="Thêm kỹ năng vào lộ trình"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Kỹ năng muốn học"
              />
              <button
                className="button"
                disabled={!normalizeEntity(custom, "skill")}
              >
                <Plus size={17} />
                Thêm
              </button>
            </form>
            <div className="timeline">
              {profile.plan.map((s) => (
                <div className="timeline-step" key={s}>
                  <input
                    type="checkbox"
                    aria-label={`Hoàn thành ${formatSkillLabel(s)}`}
                    checked={profile.completed.includes(s)}
                    onChange={(e) =>
                      update({
                        completed: e.target.checked
                          ? [...profile.completed, s]
                          : profile.completed.filter((x) => x !== s),
                      })
                    }
                  />
                  <div>
                    <h3>{formatSkillLabel(s)}</h3>
                    <p>
                      {profile.completed.includes(s)
                        ? "Đã hoàn thành · tự đánh dấu"
                        : "Đang học"}
                    </p>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={`Xóa ${formatSkillLabel(s)} khỏi lộ trình`}
                    onClick={() =>
                      update({
                        plan: profile.plan.filter((x) => x !== s),
                        completed: profile.completed.filter((x) => x !== s),
                      })
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
            {!profile.plan.length && (
              <p className="state">
                Chưa có kỹ năng trong kế hoạch. Thêm từ đây, What-If hoặc chi
                tiết tin tuyển dụng.
              </p>
            )}
          </div>
        </section>
      )}
      {!selected && tab !== "market" && tab !== "tasks" && (
        <AskMapi
          floating
          question={
            tab === "plan"
              ? "Có đường nào ngắn hơn không?"
              : trial
                ? `Tại sao tôi nên học ${trial}?`
                : "Vì sao tôi phù hợp nghề này?"
          }
          context={
            trial
              ? { kind: "skill", value: trial }
              : tab === "plan"
                ? { kind: "path", value: profile.target || "Lộ trình" }
                : { kind: "career", value: profile.target || "Nghề mục tiêu" }
          }
        />
      )}
      {selected && (
        <Sheet
          title={formatOccupationLabel(selected.job_title)}
          onClose={() => setSelected(undefined)}
        >
          <AskMapi
            question="Vì sao tôi phù hợp nghề này?"
            context={{ kind: "career", value: selected.job_title }}
            onClick={() => setSelected(undefined)}
          />
          <span className="badge">{industryName(selected.industry)}</span>
          <h3>
            {selected.demo
              ? `${selected.fit}% phù hợp · dữ liệu demo`
              : `${selected.matched_skills} kỹ năng khớp · ${selected.n_similar_jobs} tin tương tự`}
          </h3>
          <p>
            Kết quả từ kỹ năng {trial ? "giả định" : "hiện tại"} của bạn. Hiện
            chưa có danh sách kỹ năng còn thiếu theo nhóm nghề.
          </p>
          <button
            className="button full"
            onClick={() => {
              update({ target: selected.job_title });
              setSelected(undefined);
              setTab("plan");
            }}
          >
            <Flag size={17} />
            Chọn làm mục tiêu
          </button>
          <Link href="/explore?tab=jobs" className="button secondary full">
            Xem yêu cầu trong từng tin
          </Link>
        </Sheet>
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="state">Đang mở bản đồ…</div>}>
      <MapContent />
    </Suspense>
  );
}
