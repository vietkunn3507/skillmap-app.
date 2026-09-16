"use client";
import { useState } from "react";
import { ZoomIn, ZoomOut, Download, FileText } from "lucide-react";
import { Sheet, DataState } from "./ui";
import { useResource } from "@/lib/use-resource";
import { ProfileAvatar } from "./profile-avatar";
import { formatSkillLabel, formatOccupationLabel } from "@/lib/taxonomy";
type Preview = {
  kind: "sample" | "document";
  filename: string;
  text?: string;
  profile?: {
    name: string;
    education: string;
    field: string;
    target: string;
    skills: string[];
    tools: string[];
    tasks: string[];
    languages: string[];
  };
};
export function CvPreview({ onClose }: { onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const data = useResource("cv-preview", async (signal) => {
    const r = await fetch("/api/cv/preview", { signal, cache: "no-store" });
    const result = await r.json();
    if (!r.ok) throw Error(result.error || "Chưa tải được CV.");
    return result as Preview;
  });
  const p = data.data?.profile;
  return (
    <Sheet title="CV hiện tại" onClose={onClose}>
      <div className="cv-preview-toolbar">
        <span>
          <FileText size={15} />
          {data.data?.filename || "Bản xem CV"}
        </span>
        <div>
          <button
            aria-label="Thu nhỏ CV"
            disabled={zoom === 1}
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
          >
            <ZoomOut size={18} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Phóng to CV"
            disabled={zoom >= 1.75}
            onClick={() => setZoom((z) => Math.min(1.75, z + 0.25))}
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>
      <DataState {...data}>
        <div
          className="cv-preview-scroll"
          tabIndex={0}
          aria-label="Nội dung CV có thể phóng to"
        >
          <article
            className={`cv-paper ${p ? "cv-paper-sample" : ""}`}
            style={{ width: `${zoom * 100}%`, fontSize: `${11 * zoom}px` }}
          >
            {p ? (
              <>
                <aside className="cv-paper-sidebar">
                  <ProfileAvatar name={p.name} size={56} />
                  <h3>{p.name}</h3>
                  <p>{p.education}</p>
                  <h4>HỌC VẤN</h4>
                  <p>{p.field}</p>
                  <h4>KỸ NĂNG</h4>
                  <ul>
                    {p.skills.map((s) => (
                      <li key={s}>{formatSkillLabel(s)}</li>
                    ))}
                  </ul>
                  <h4>CÔNG CỤ</h4>
                  <ul>
                    {p.tools.map((s) => (
                      <li key={s}>{formatSkillLabel(s)}</li>
                    ))}
                  </ul>
                  <h4>NGÔN NGỮ</h4>
                  <ul>
                    {p.languages.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </aside>
                <div className="cv-paper-main">
                  <header>
                    <span>HỒ SƠ NGHỀ NGHIỆP</span>
                    <h2>{p.name}</h2>
                    <p>{formatOccupationLabel(p.target)}</p>
                  </header>
                  <section>
                    <h3>Mục tiêu nghề nghiệp</h3>
                    <p>
                      Sinh viên định hướng tài chính và kinh doanh, mong muốn
                      phát triển thành Financial Analyst. Quan tâm đến phân tích
                      báo cáo, trực quan hóa dữ liệu và hỗ trợ ra quyết định.
                    </p>
                  </section>
                  <section>
                    <h3>Dự án & kinh nghiệm học tập</h3>
                    <h4>Phân tích dữ liệu tài chính</h4>
                    <p>
                      Thực hành tổng hợp dữ liệu, đọc báo cáo tài chính và phân
                      tích doanh thu bằng Excel.
                    </p>
                    <h4>Trực quan hóa & báo cáo</h4>
                    <p>
                      Sử dụng Power BI để làm dashboard, tổng hợp kết quả và
                      trình bày báo cáo.
                    </p>
                  </section>
                  <section>
                    <h3>Nhiệm vụ đã thực hiện</h3>
                    <ul>
                      {p.tasks.map((t) => (
                        <li key={t}>{formatSkillLabel(t)}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h3>Chứng chỉ</h3>
                    <p>Chưa bổ sung thông tin chứng chỉ.</p>
                  </section>
                  <footer>Hồ sơ mẫu Phương · Dữ liệu cá nhân minh họa</footer>
                </div>
              </>
            ) : (
              <>
                <header className="cv-document-header">
                  <FileText size={22} />
                  <h2>{data.data?.filename}</h2>
                  <p>Nội dung văn bản từ CV của bạn</p>
                </header>
                <div className="cv-document-text">
                  {data.data?.text
                    ?.split(/\n\s*\n/)
                    .filter(Boolean)
                    .map((t, i) => (
                      <p key={i}>{t}</p>
                    ))}
                </div>
              </>
            )}
          </article>
        </div>
      </DataState>
      <a className="button secondary full" href="/api/cv?download=1" download>
        <Download size={16} />
        Tải tệp gốc
      </a>
    </Sheet>
  );
}
