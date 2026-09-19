"use client";
import { AnswerText } from "@/components/mapi/answer-text";
import Link from "next/link";
import { useResource } from "@/lib/use-resource";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowUp,
  Plus,
  Check,
  ArrowLeft,
  X,
  Info,
} from "lucide-react";
import { Mapi } from "@/components/mapi/mascot";
import CvStudio from "@/components/mapi/cv-studio";
import { useProfile } from "@/components/profile-provider";
import type { MapiContext, MapiReply, MapiCard } from "@/lib/mapi";
import {
  formatSkillLabel,
  formatOccupationLabel,
  skillKey,
} from "@/lib/taxonomy";
type Turn = {
  id: number;
  question: string;
  reply?: MapiReply;
  error?: string;
  context?: MapiContext;
};
function EvidenceCard({ card }: { card: MapiCard }) {
  const { profile, update } = useProfile();
  const [added, setAdded] = useState(false);
  const planned =
    !!card.skill &&
    profile.plan.some((s) => skillKey(s) === skillKey(card.skill!));
  return (
    <article className="mapi-evidence">
      <span className="eyebrow">{card.eyebrow}</span>
      <div className="mapi-evidence-title">
        <h3>{card.title}</h3>
        {added && <Mapi state="success" size={44} />}
      </div>
      {card.rows && (
        <dl className="mapi-facts">
          {card.rows.map((r, i) => (
            <div key={i}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {card.skills && card.skills.length > 0 && (
        <>
          <h4>Kỹ năng chưa có trong hồ sơ</h4>
          <div className="chips">
            {card.skills.map((s) => (
              <span className="chip" key={s}>
                {formatSkillLabel(s)}
              </span>
            ))}
          </div>
        </>
      )}
      {card.occupations && (
        <div className="chips">
          {card.occupations.map((s) => (
            <Link className="chip" href="/map?tab=map" key={s}>
              {formatOccupationLabel(s)}
              <ArrowUpRight size={13} />
            </Link>
          ))}
        </div>
      )}
      <p className="source">{card.source}</p>
      <div className="mapi-card-actions">
        <Link
          href="/map?tab=map"
          className="button"
          onClick={() => {
            if (card.skill) update({ whatIf: card.skill });
          }}
        >
          Xem trên bản đồ
          <ArrowUpRight size={16} />
        </Link>
        {card.skill && (
          <button
            className="button secondary"
            disabled={planned}
            onClick={() => {
              update({ plan: [...profile.plan, card.skill!] });
              setAdded(true);
            }}
          >
            {planned ? <Check size={16} /> : <Plus size={16} />}{" "}
            {planned
              ? `${formatSkillLabel(card.skill)} đã trong kế hoạch`
              : `Thêm ${formatSkillLabel(card.skill)} vào kế hoạch`}
          </button>
        )}
      </div>
    </article>
  );
}
function MapiPage() {
  const capability = useResource("mapi-capability", async (signal) => {
    const response = await fetch("/api/mapi", { signal, cache: "no-store" });
    if (!response.ok) throw Error("Không kiểm tra được chế độ Mapi.");
    return response.json() as Promise<{ mode: "llm" | "unavailable" }>;
  });
  const { profile } = useProfile();
  const params = useSearchParams();
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState<MapiContext>();
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const consumed = useRef("");
  const bottom = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const target = formatOccupationLabel(profile.target || "nghề mục tiêu");
  const suggestions = [
    "SQL hay Python nên học trước?",
    `Tôi còn thiếu gì để làm ${target}?`,
    "Có nghề nào gần với kỹ năng của tôi hơn không?",
    "Power BI giúp tôi mở rộng sang nghề nào?",
    "Thị trường đang cần kỹ năng gì?",
  ];
  async function ask(
    question: string,
    ctx: MapiContext | null | undefined = context,
  ) {
    question = question.trim();
    if (!question || controller.current) return;
    const abort = new AbortController();
    controller.current = abort;
    const id = ++sequence.current;
    setBusy(true);
    setDraft("");
    setTurns((old) => [...old, { id, question, context: ctx || undefined }]);
    try {
      const response = await fetch("/api/mapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: ctx || undefined,
          history: turns.filter(turn => turn.reply).slice(-4).map(turn => ({ question: turn.question, answer: turn.reply!.text.slice(0, 12000) })),
        }),
        signal: abort.signal,
      });
      const body = await response.json();
      if (!response.ok)
        throw Error(
          body.error || "Chưa nhận được câu trả lời. Bạn thử lại nhé.",
        );
      setTurns((old) =>
        old.map((t) => (t.id === id ? { ...t, reply: body } : t)),
      );
    } catch (e) {
      setTurns((old) =>
        old.map((t) =>
          t.id === id
            ? {
                ...t,
                error: abort.signal.aborted
                  ? "Đã dừng tra cứu."
                  : e instanceof Error
                    ? e.message
                    : "Chưa kết nối được dữ liệu.",
              }
            : t,
        ),
      );
    } finally {
      if (controller.current === abort) {
        controller.current = null;
        setBusy(false);
      }
    }
  }
  useEffect(() => {
    const question = params.get("q");
    const key = params.toString();
    if (!question || question.length > 2000 || consumed.current === key) return;
    const kind = params.get("context");
    const value = params.get("value");
    const ctx =
      kind &&
      ["career", "skill", "path", "job"].includes(kind) &&
      value &&
      value.length <= 160
        ? ({ kind, value } as MapiContext)
        : undefined;
    const timer = setTimeout(() => {
      consumed.current = key;
      setContext(ctx);
      void ask(question, ctx);
    }, 0);
    return () => clearTimeout(timer);
  }, [params]);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (turns.length)
      bottom.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "nearest",
      });
  }, [turns, busy]);
  if (params.get("view") === "cv")
    return (
      <div className="stack">
        <Link href="/ai" className="text-link">
          <ArrowLeft size={16} />
          Quay lại với Mapi
        </Link>
        <CvStudio />
      </div>
    );
  return (
    <div className={`mapi-page ${turns.length ? "mapi-has-conversation" : ""}`}>
      <header className="mapi-page-header">
        <div className="mapi-title">
          <Mapi state="neutral" size={68} />
          <div>
            <h1>Hỏi Mapi</h1>
            <p>Trợ lý nghề nghiệp của bạn</p>
            <span className="source">
              {capability.loading
                ? "Đang kiểm tra kết nối…"
                : capability.error
                  ? "Chưa xác định chế độ kết nối"
                  : capability.data?.mode === "llm"
                    ? "Gemini AI · trả lời kèm nguồn"
                    : "Gemini hiện chưa sẵn sàng"}
            </span>
          </div>
        </div>
        <Link href="/ai?view=cv" className="mapi-cv-link">
          Góc CV
          <ArrowUpRight size={15} />
        </Link>
      </header>
      <div className="mapi-workspace">
        <section className="mapi-welcome">
          <div className="mapi-welcome-illustration">
            <div className="mapi-orbit-ring" />
            <Mapi state="greeting" size={142} />
            
          </div>
          
          <h2>
            Chào {profile.name || "bạn"},<br />
            hôm nay mình có thể giúp gì?
          </h2>
          
          <div className="mapi-suggestions" aria-label="Câu hỏi gợi ý">
            {suggestions.map((question, i) => (
              <button
                key={question}
                onClick={() => {
                  setContext(undefined);
                  void ask(question, null);
                }}
                disabled={busy}
              >
                <span className="mapi-question-number">0{i + 1}</span>
                <span>{question}</span>
                <ArrowUpRight size={18} />
              </button>
            ))}
          </div>
          <details className="mapi-transparency">
            <summary>
              <Info size={14} />
              Mapi dùng thông tin nào?
            </summary>
            <p>
              Hồ sơ và kế hoạch đã lưu của bạn, cùng dữ liệu tuyển dụng trong hệ
              thống. Gemini chọn dữ liệu cần truy xuất và tổng
              hợp câu trả lời kèm nguồn. Hồ sơ Phương và điểm phù hợp demo được ghi rõ khi
              sử dụng.
            </p>
          </details>
        </section>
        <section className="mapi-conversation" aria-label="Trao đổi với Mapi">
          {context && (
            <div className="mapi-context-badge">
              <span>
                Đang xem:{" "}
                {context.kind === "job"
                  ? `Tin tuyển dụng #${context.value}`
                  : context.kind === "skill"
                    ? formatSkillLabel(context.value)
                    : context.kind === "path"
                      ? "Lộ trình của bạn"
                      : formatOccupationLabel(context.value)}
              </span>
              <button
                aria-label="Bỏ ngữ cảnh"
                onClick={() => {
                  setContext(undefined);
                  router.replace("/ai", { scroll: false });
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div
            className="mapi-turns"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {turns.map((turn, i) => (
              <article className="mapi-turn" key={turn.id}>
                <div className="mapi-user-question">
                  
                  <h2>{turn.question}</h2>
                </div>
                {turn.reply ? (
                  <>
                    <div className="mapi-answer-intro">
                      <Mapi state={turn.reply.state} size={58} />
                      <div>
                        <span className="mapi-signature">Mapi</span>
                        <AnswerText text={turn.reply.text} />
                      </div>
                    </div>
                    {turn.reply.cards.map((card, j) => (
                      <EvidenceCard key={j} card={card} />
                    ))}
                    {!!turn.reply.citations?.length && (
                      <div className="mapi-sources" aria-label="Nguồn trả lời">
                        <strong>Nguồn đã truy xuất</strong>
                        {turn.reply.citations.map((source) => (
                          <a
                            key={source.id}
                            href={source.href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            [{source.id}] {source.label} ↗
                          </a>
                        ))}
                      </div>
                    )}
                    {turn.reply.note && (
                      <p className="mapi-answer-note">{turn.reply.note}</p>
                    )}
                  </>
                ) : turn.error ? (
                  <div className="mapi-answer-intro" role="alert">
                    <Mapi state="attention" size={58} />
                    <div>
                      <p>{turn.error}</p>
                      <button
                        className="text-link"
                        disabled={busy}
                        onClick={() => void ask(turn.question, turn.context)}
                      >
                        Thử lại
                      </button>
                    </div>
                  </div>
                ) : i === turns.length - 1 && busy ? (
                  <div className="mapi-thinking" role="status">
                    <Mapi state="thinking" size={72} />
                    <div>
                      <strong>
                        Mapi đang xem hồ sơ
                        <br />
                        và dữ liệu thị trường…
                      </strong>
                      <span className="mapi-loading-dots">
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          <div ref={bottom} />
          <form
            className="mapi-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(draft);
            }}
          >
            <label htmlFor="mapi-question" className="sr-only">
              Câu hỏi cho Mapi
            </label>
            <textarea
              id="mapi-question"
              ref={composer}
              placeholder="Hỏi Mapi về bước tiếp theo của bạn…"
              value={draft}
              maxLength={2000}
              rows={2}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  if (!busy) void ask(draft);
                }
              }}
            />
            {busy ? (
              <button
                type="button"
                className="mapi-send"
                aria-label="Dừng tra cứu"
                onClick={() => controller.current?.abort()}
              >
                <span className="mapi-stop" />
              </button>
            ) : (
              <button
                className="mapi-send"
                aria-label="Gửi câu hỏi"
                disabled={!draft.trim()}
              >
                <ArrowUp size={20} />
              </button>
            )}
          </form>
          <div className="mapi-composer-foot">
            
            <span>{draft.length}/2000</span>
          </div>
        </section>
      </div>
    </div>
  );
}
export default function AiPage() {
  return (
    <Suspense
      fallback={
        <div className="mapi-thinking">
          <Mapi state="thinking" size={72} />
          <p>Mapi đang chuẩn bị…</p>
        </div>
      }
    >
      <MapiPage />
    </Suspense>
  );
}
