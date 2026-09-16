"use client";
import Link from "next/link";
import { useState } from "react";
import {
  UploadCloud,
  Sparkles,
  Check,
  Copy,
  Download,
  ArrowRight,
} from "lucide-react";
import { DemoNotice, SectionTitle } from "@/components/ui";
import { demoAudit } from "@/lib/demo";
export default function AiPage() {
  const [analyzed, setAnalyzed] = useState(false);
  const [accepted, setAccepted] = useState<number[]>([]);
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [messages, setMessages] = useState<{ from: string; text: string }[]>(
    [],
  );
  const [question, setQuestion] = useState("");
  function download() {
    const text = demoAudit
      .filter((_, i) => accepted.includes(i))
      .map((s) => s.after)
      .join("\n\n");
    const url = URL.createObjectURL(
      new Blob(
        [
          "BẢN NHÁP MINH HỌA — điền thông tin chính xác trước khi sử dụng.\n\n" +
            text,
        ],
        { type: "text/plain;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "skillmap-ban-nhap.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="stack">
      <section className="greeting">
        <span className="eyebrow">
          <Sparkles size={14} /> TRỢ LÝ AI
        </span>
        <h1>Phân tích & tối ưu CV</h1>
        <p>Nhìn rõ kỹ năng. Chuẩn bị bước tiếp theo.</p>
      </section>
      <DemoNotice>
        Chưa có dịch vụ đánh giá CV chuyên sâu hoặc trò chuyện AI. Nội dung bên
        dưới là mẫu minh họa, không phải kết quả đánh giá hồ sơ của bạn.
      </DemoNotice>
      <section className="card">
        <Link className="upload" href="/profile#cv">
          <UploadCloud size={35} />
          <strong>CV và kỹ năng của bạn</strong>
          <span>Tải CV mới hoặc phân tích văn bản trong Hồ sơ → CV</span>
        </Link>
        <button className="button full" onClick={() => setAnalyzed(true)}>
          <Sparkles size={17} />
          Xem bản phân tích mẫu
        </button>
      </section>
      {analyzed && (
        <>
          <div className="audit-hero">
            <span className="badge">BẢN MINH HỌA</span>
            <div className="audit-ring">
              <Sparkles size={40} />
            </div>
            <h2>Viết rõ giá trị của bạn</h2>
            <p>
              Chưa có điểm ATS hoặc điểm năng lực. Hãy dùng các gợi ý bên dưới
              như một mẫu soạn thảo.
            </p>
          </div>
          <section>
            <SectionTitle
              title="Gợi ý tối ưu"
              subtitle="Giữ lại thông tin có thể xác minh"
            />
            <div className="tabs">
              <button
                className={filter === "all" ? "selected" : ""}
                onClick={() => setFilter("all")}
              >
                Tất cả
              </button>
              <button
                className={filter === "accepted" ? "selected" : ""}
                onClick={() => setFilter("accepted")}
              >
                Đã chọn ({accepted.length})
              </button>
            </div>
            <div className="stack">
              {demoAudit.map((item, i) =>
                filter === "accepted" && !accepted.includes(i) ? null : (
                  <article className="card" key={item.title}>
                    <span className="badge">GỢI Ý MẪU</span>
                    <h3>{item.title}</h3>
                    <div className="before">
                      <span>TRƯỚC</span>
                      <p>{item.before}</p>
                    </div>
                    <div className="after">
                      <span>SAU · ĐIỀN THÔNG TIN CỦA BẠN</span>
                      <p>{item.after}</p>
                    </div>
                    <div className="action-row">
                      <button
                        className="button secondary"
                        onClick={() =>
                          setAccepted((a) =>
                            a.includes(i)
                              ? a.filter((x) => x !== i)
                              : [...a, i],
                          )
                        }
                      >
                        <Check size={16} />
                        {accepted.includes(i) ? "Đã chọn" : "Chọn vào bản nháp"}
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Sao chép ${item.title}`}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(item.after);
                            setNotice("Đã sao chép gợi ý mẫu.");
                          } catch {
                            setNotice(
                              "Không thể truy cập bộ nhớ tạm. Bạn có thể chọn và sao chép văn bản.",
                            );
                          }
                        }}
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </article>
                ),
              )}
              {filter === "accepted" && !accepted.length && (
                <p className="state">Bạn chưa chọn gợi ý nào.</p>
              )}
            </div>
          </section>
          <button
            className="button full"
            disabled={!accepted.length}
            onClick={download}
          >
            <Download size={17} />
            Xuất bản nháp TXT
          </button>
          <p role="status">{notice}</p>
        </>
      )}
      <section className="card">
        <SectionTitle title="Hỏi trợ lý" subtitle="Hội thoại mẫu" />
        <DemoNotice>
          Câu trả lời hướng dẫn cố định, không sử dụng mô hình AI.
        </DemoNotice>
        <div className="chat" aria-live="polite">
          {messages.map((m, i) => (
            <p
              className={m.from === "you" ? "chat-user" : "chat-assistant"}
              key={i}
            >
              {m.text}
            </p>
          ))}
        </div>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!question.trim()) return;
            setMessages((m) => [
              ...m,
              { from: "you", text: question.trim() },
              {
                from: "assistant",
                text: "[Minh họa] Hãy mở một tin tuyển dụng ở Khám phá, đối chiếu kỹ năng của bạn và chọn một kỹ năng còn thiếu vào lộ trình. Tính năng trò chuyện cá nhân hóa sẽ cần thêm dịch vụ AI.",
              },
            ]);
            setQuestion("");
          }}
        >
          <input
            aria-label="Câu hỏi cho trợ lý"
            placeholder="Tôi nên bắt đầu từ đâu?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            className="button"
            aria-label="Gửi câu hỏi"
            disabled={!question.trim()}
          >
            <ArrowRight size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}
