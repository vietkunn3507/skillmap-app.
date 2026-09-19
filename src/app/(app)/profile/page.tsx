"use client";
import Link from "next/link";
import { CvPreview } from "@/components/cv-preview";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useState } from "react";
import {
  User,
  Plus,
  X,
  Check,
  Bookmark,
  FileText,
  Upload,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useProfile } from "@/components/profile-provider";
import { SectionTitle, DataState } from "@/components/ui";
import { JobSheet } from "@/components/jobs";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";
import { sameSkill } from "@/lib/format";
import { formatSkillLabel, formatOccupationLabel } from "@/lib/taxonomy";
import { authClient } from "@/lib/auth-client";
import type { Industry } from "@/lib/types";
export default function ProfilePage() {
  const { profile, update, user, refresh, saving } = useProfile();
  const [cvOpen, setCvOpen] = useState(false);
  const [skill, setSkill] = useState("");
  const [notice, setNotice] = useState("");
  const [cvError, setCvError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<number>();
  const top = useResource("top:" + profile.industry, (s) =>
    api.top(profile.industry, s),
  );
  function add(value: string) {
    const v = value.trim();
    if (!v) return;
    if (profile.skills.some((s) => sameSkill(s, v))) {
      setNotice("Kỹ năng này đã có trong hồ sơ.");
      return;
    }
    update({ skills: [...profile.skills, v] });
    setSkill("");
    setNotice("Đã thêm kỹ năng.");
  }
  async function upload(file: File) {
    setBusy(true);
    setCvError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const r = await fetch("/api/cv", { method: "POST", body: form });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      await refresh();
      setNotice("Đã tải CV mới. Bạn có thể bắt đầu phân tích.");
    } catch (e) {
      setCvError(e instanceof Error ? e.message : "Không tải được CV.");
    } finally {
      setBusy(false);
    }
  }
  async function analyze() {
    setBusy(true);
    setCvError("");
    try {
      const r = await fetch("/api/cv/analyze", { method: "POST" });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      await refresh();
      setNotice(result.message);
    } catch (e) {
      setCvError(e instanceof Error ? e.message : "Không phân tích được CV.");
    } finally {
      setBusy(false);
    }
  }
  const completion = profile.demo
    ? 100
    : Math.round(
        ([
          !!profile.name,
          !!profile.education,
          profile.skills.length > 0,
          !!profile.target,
          !!profile.cv,
        ].filter(Boolean).length /
          5) *
          100,
      );
  return (
    <div className="profile-grid">
      <section className="greeting wide">
        
        <h1>{profile.name || "Hồ sơ kỹ năng"}</h1>
        <p>
          {profile.education}
          {profile.field ? " · " + profile.field : ""}
        </p>
        {profile.demo && (
          <span className="badge">
            Tài khoản demo · Dữ liệu cá nhân minh họa
          </span>
        )}
      </section>
      <section className="profile-column stack">
        <div className="card profile-heading">
          <div className="profile-avatar">
            <ProfileAvatar name={profile.name} size={64} />
          </div>
          <div>
            <h2>{profile.name || "Hồ sơ của bạn"}</h2>
            <span>
              {profile.demo ? "Sinh viên · Tài chính / Kinh doanh" : user.email}
            </span>
            <p className="source">
              Hoàn thiện hồ sơ: {completion}%{profile.demo ? " · demo" : ""}
            </p>
          </div>
        </div>
        <section className="card current-cv-card" id="cv">
          <SectionTitle title="CV hiện tại" action={<FileText size={22} />} />
          <h3>{profile.cv?.filename || "Chưa có CV"}</h3>
          <span className="badge">
            {profile.cv?.status === "analyzed"
              ? "Đã phân tích"
              : profile.cv
                ? "Đã tải CV"
                : "Chưa tải CV"}
          </span>
          <div className="cv-actions">
            {profile.cv && (
              <button
                className="button secondary"
                onClick={() => setCvOpen(true)}
              >
                <FileText size={15} />
                Xem CV
              </button>
            )}
            <label className="button secondary">
              <Upload size={15} />
              Tải CV mới
              <input
                type="file"
                className="sr-only"
                aria-label="Tải CV mới"
                accept=".pdf,.docx,.txt"
                disabled={busy}
                onChange={(e) => {
                  if (e.target.files?.[0]) void upload(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {profile.cv && (
              <button
                className="button secondary"
                onClick={analyze}
                disabled={busy}
              >
                <RefreshCw size={15} className={busy ? "spin" : ""} />
                {profile.cv.status === "analyzed"
                  ? "Phân tích lại"
                  : "Phân tích CV"}
              </button>
            )}
          </div>
          <p className="source">
            PDF, DOCX hoặc TXT · tối đa 10 MB. Văn bản được đối chiếu với danh
            mục kỹ năng; vui lòng kiểm tra kết quả trước khi sử dụng.
          </p>
          {cvError && (
            <p role="alert" className="error-text">
              {cvError}
            </p>
          )}
        </section>
        <form
          className="card stack"
          onSubmit={(e) => {
            e.preventDefault();
            setNotice(saving ? "Đang lưu thay đổi…" : "Hồ sơ đã được lưu.");
          }}
        >
          <SectionTitle title="Thông tin cá nhân" />
          <label>
            Tên của bạn
            <input
              value={profile.name}
              maxLength={50}
              onChange={(e) => update({ name: e.target.value })}
            />
          </label>
          <label>
            Học vấn
            <input
              value={profile.education}
              maxLength={150}
              onChange={(e) => update({ education: e.target.value })}
            />
          </label>
          <label>
            Lĩnh vực
            <input
              value={profile.field}
              maxLength={150}
              onChange={(e) => update({ field: e.target.value })}
            />
          </label>
          <label>
            Ngành quan tâm
            <select
              value={profile.industry}
              onChange={(e) => update({ industry: e.target.value as Industry })}
            >
              <option value="it_data">IT & Dữ liệu</option>
              <option value="ke_toan_tai_chinh">Tài chính & Kế toán</option>
            </select>
          </label>
          <button className="button" disabled={saving}>
            {saving ? "Đang lưu…" : "Lưu hồ sơ"}
            <Check size={17} />
          </button>
        </form>
        <button
          className="button logout-button"
          onClick={async () => {
            const result = await authClient.signOut();
            if (result.error) {
              setNotice("Chưa thể đăng xuất. Vui lòng thử lại.");
              return;
            }
            window.location.assign("/login");
          }}
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </section>
      <section className="profile-column stack">
        <section className="card">
          <SectionTitle
            title="Kỹ năng"
            subtitle={`${profile.skills.length} kỹ năng trong hồ sơ`}
          />
          <div className="chips">
            {profile.skills.map((s) => (
              <button
                className="chip"
                key={s}
                onClick={() =>
                  update({ skills: profile.skills.filter((x) => x !== s) })
                }
                aria-label={`Xóa kỹ năng ${formatSkillLabel(s)}`}
              >
                {formatSkillLabel(s)}
                <X size={14} />
              </button>
            ))}
          </div>
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              add(skill);
            }}
          >
            <input
              aria-label="Tên kỹ năng"
              placeholder="Ví dụ: SQL, Excel…"
              maxLength={80}
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
            <button className="button" disabled={!skill.trim()}>
              <Plus size={16} />
              Thêm
            </button>
          </form>
          <h4>Gợi ý từ dữ liệu tuyển dụng</h4>
          <DataState {...top} empty={top.data?.skills.length === 0}>
            <div className="chips">
              {top.data?.skills.slice(0, 8).map((s) => (
                <button
                  className="chip ghost"
                  disabled={profile.skills.some((p) =>
                    sameSkill(p, s.skill_display),
                  )}
                  key={s.skill_display}
                  onClick={() => add(s.skill_display)}
                >
                  <Plus size={13} />
                  {formatSkillLabel(s.skill_display)}
                </button>
              ))}
            </div>
          </DataState>
          <h4>Công cụ</h4>
          <div className="chips">
            {profile.tools.map((s) => (
              <span className="chip" key={s}>
                {formatSkillLabel(s)}
              </span>
            ))}
          </div>
          <h4>Kinh nghiệm / nhiệm vụ</h4>
          <ul className="task-list">
            {profile.tasks.map((t) => (
              <li key={t}>{formatSkillLabel(t)}</li>
            ))}
          </ul>
          <h4>Ngôn ngữ</h4>
          <div className="chips">
            {profile.languages.map((l) => (
              <span className="chip" key={l}>
                {l}
              </span>
            ))}
          </div>
        </section>
        <section className="card">
          <SectionTitle title="Nghề mục tiêu" />
          <h2>
            {profile.target
              ? formatOccupationLabel(profile.target)
              : "Chưa chọn mục tiêu"}
          </h2>
          {profile.demo && profile.target === "Financial Analyst" && (
            <>
              <div className="bar-track">
                <i style={{ width: "82%" }} />
              </div>
              <p className="source">82% phù hợp · dữ liệu demo</p>
            </>
          )}
          <Link href="/map?tab=map" className="text-link">
            Xem bản đồ của tôi →
          </Link>
          <h4>Kế hoạch học</h4>
          <ol className="task-list">
            {profile.plan.map((s) => (
              <li key={s}>{formatSkillLabel(s)}</li>
            ))}
          </ol>
        </section>
        <section className="card">
          <SectionTitle title="Đã lưu" />
          <h4>Nghề nghiệp</h4>
          <div className="chips">
            {profile.savedOccupations.map((s) => (
              <button
                className="chip"
                key={s}
                aria-label={`Bỏ lưu nghề ${formatOccupationLabel(s)}`}
                onClick={() =>
                  update({
                    savedOccupations: profile.savedOccupations.filter(
                      (x) => x !== s,
                    ),
                  })
                }
              >
                {formatOccupationLabel(s)}
                <X size={13} />
              </button>
            ))}
          </div>
          <h4>Kỹ năng</h4>
          <div className="chips">
            {profile.savedSkills.map((s) => (
              <button
                className="chip"
                key={s}
                aria-label={`Bỏ lưu kỹ năng ${formatSkillLabel(s)}`}
                onClick={() =>
                  update({
                    savedSkills: profile.savedSkills.filter((x) => x !== s),
                  })
                }
              >
                {formatSkillLabel(s)}
                <X size={13} />
              </button>
            ))}
          </div>
          <h4>Tin tuyển dụng</h4>
          {profile.saved.length === 0 ? (
            <p className="muted">Bạn chưa lưu tin tuyển dụng.</p>
          ) : (
            <div className="saved-list">
              {profile.saved.map((id) => (
                <button key={id} onClick={() => setSelected(id)}>
                  <Bookmark size={17} />
                  <span>Tin tuyển dụng #{id}</span>
                  <span>Xem →</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </section>
      <p role="status" className="success-text wide">
        {notice}
      </p>
      {cvOpen && <CvPreview onClose={() => setCvOpen(false)} />}
      {selected !== undefined && (
        <JobSheet id={selected} onClose={() => setSelected(undefined)} />
      )}
    </div>
  );
}
