"use client";
import {
  formatSkillLabel,
  formatOccupationLabel,
  formatLocationLabel,
} from "@/lib/taxonomy";
import { AskMapi } from "./mapi/ask-mapi";
import { useProfile } from "./profile-provider";
import { DataState, Sheet } from "./ui";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";
import { salary, sameSkill, industryName } from "@/lib/format";
import { Bookmark, MapPin, ArrowUpRight, Check, Plus } from "lucide-react";
import type { Job } from "@/lib/types";
export function JobCard({ job, onOpen }: { job: Job; onOpen: () => void }) {
  const { profile, update } = useProfile();
  const saved = profile.saved.includes(job.job_id);
  return (
    <article className="card job-card">
      <div className="job-meta">
        <span className="badge">{industryName(job.industry)}</span>
        <button
          className="icon-button"
          aria-label={saved ? "Bỏ lưu việc làm" : "Lưu việc làm"}
          aria-pressed={saved}
          onClick={() =>
            update({
              saved: saved
                ? profile.saved.filter((id) => id !== job.job_id)
                : [...profile.saved, job.job_id],
            })
          }
        >
          <Bookmark size={19} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <h2>{formatOccupationLabel(job.job_title)}</h2>
      <p>{job.company_name}</p>
      <div className="job-meta muted">
        <span>
          <MapPin size={14} />
          {formatLocationLabel(job.location || "Chưa công bố")}
        </span>
        <span>{job.posted_date}</span>
      </div>
      <strong className="salary">
        {salary(job.salary_min, job.salary_max)}
      </strong>
      <button className="button secondary full" onClick={onOpen}>
        Phân tích cùng SkillMAP <ArrowUpRight size={18} />
      </button>
    </article>
  );
}
export function JobSheet({ id, onClose }: { id: number; onClose: () => void }) {
  const data = useResource("job:" + id, (s) => api.job(id, s));
  const { profile, update } = useProfile();
  const job = data.data;
  const [have, missing] = [
    job?.skills?.filter((s) =>
      profile.skills.some((p) => sameSkill(p, s.skill_display)),
    ) || [],
    job?.skills?.filter(
      (s) => !profile.skills.some((p) => sameSkill(p, s.skill_display)),
    ) || [],
  ];
  return (
    <Sheet title="Chi tiết nghề & kỹ năng" onClose={onClose}>
      <DataState {...data}>
        {job && (
          <>
            <span className="badge">{industryName(job.industry)}</span>
            <h2 className="spaced">{formatOccupationLabel(job.job_title)}</h2>
            <p>{job.company_name}</p>
            <strong className="salary">
              {salary(job.salary_min, job.salary_max)}
            </strong>
            <dl className="detail-grid">
              <div>
                <dt>Khu vực</dt>
                <dd>{formatLocationLabel(job.location || "Chưa công bố")}</dd>
              </div>
              <div>
                <dt>Kinh nghiệm</dt>
                <dd>{job.experience_required || "Chưa công bố"}</dd>
              </div>
              <div>
                <dt>Cấp bậc</dt>
                <dd>{job.seniority || "Chưa công bố"}</dd>
              </div>
              <div>
                <dt>Ngày đăng</dt>
                <dd>{job.posted_date}</dd>
              </div>
            </dl>
            <AskMapi
              question="Tôi phù hợp tin tuyển dụng này không?"
              context={{ kind: "job", value: String(job.job_id) }}
              onClick={onClose}
            />
            <h3>Phân tích kỹ năng</h3>
            <p className="muted">
              Đối chiếu tên kỹ năng trong tin với hồ sơ bạn tự nhập, không phải
              điểm đánh giá năng lực.
            </p>
            <h4>Bạn đã có · {have.length}</h4>
            <div className="chips">
              {have.map((s) => (
                <span className="chip" key={formatSkillLabel(s.skill_display)}>
                  <Check size={14} />
                  {formatSkillLabel(s.skill_display)}
                </span>
              ))}
            </div>
            <h4>Chưa có trong hồ sơ · {missing.length}</h4>
            <div className="chips">
              {missing.map((s) => (
                <button
                  key={formatSkillLabel(s.skill_display)}
                  className="chip coral"
                  disabled={profile.plan.includes(s.skill_display)}
                  onClick={() =>
                    update({ plan: [...profile.plan, s.skill_display] })
                  }
                >
                  <Plus size={14} />
                  {formatSkillLabel(s.skill_display)}
                  {profile.plan.includes(s.skill_display) ? " · Đã lưu" : ""}
                </button>
              ))}
            </div>
            {!job.skills?.length && (
              <p>Chưa có kỹ năng được trích xuất cho tin này.</p>
            )}
            <button
              className="button full"
              onClick={() => update({ target: job.job_title })}
            >
              {profile.target === job.job_title
                ? "Đã chọn mục tiêu"
                : "Chọn làm mục tiêu"}
            </button>
            {job.source_url && /^https?:\/\//.test(job.source_url) && (
              <a
                className="button secondary full"
                href={job.source_url}
                target="_blank"
                rel="noreferrer"
              >
                Xem tin tuyển dụng <ArrowUpRight size={16} />
              </a>
            )}
            <p className="source">
              Tin trong bộ dữ liệu lịch sử có thể đã hết hạn. Mức lương thuộc
              tin này, không phải lương trung vị của nghề.
            </p>
          </>
        )}
      </DataState>
    </Sheet>
  );
}
