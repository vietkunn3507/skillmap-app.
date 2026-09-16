import { visibleEntities } from "../lib/taxonomy.ts";
import type { Profile, Skill, MatchResponse, Job } from "../lib/types.ts";
import type { MapiContext, MapiReply, MapiCard } from "../lib/mapi.ts";
import {
  skillKey,
  formatSkillLabel,
  formatOccupationLabel,
} from "../lib/taxonomy.ts";
import { demoGaps, demoMatches } from "../lib/profile-data.ts";
export type MapiEvidence = {
  top: (industry: string) => Promise<{ skills: Skill[] }>;
  match: (skills: string[]) => Promise<MatchResponse>;
  job: (id: number) => Promise<Job>;
};
const unavailable = "Hiện mình chưa có đủ dữ liệu để kết luận.";
const same = (a: string, b: string) => skillKey(a) === skillKey(b);
const source =
  "Nguồn: tin tuyển dụng trong hệ thống. Tin lịch sử có thể đã hết hạn.";
export async function answerMapi(
  profile: Profile,
  question: string,
  context: MapiContext | undefined,
  evidence: MapiEvidence,
): Promise<MapiReply> {
  const q = skillKey(question);
  const cards: MapiCard[] = [];
  const target = profile.target
    ? formatOccupationLabel(profile.target)
    : "nghề mục tiêu";
  if (context?.kind === "job") {
    const job = await evidence.job(Number(context.value));
    if (!job.skills?.length)
      return {
        text: unavailable,
        note: "Tin này chưa có danh sách kỹ năng để đối chiếu.",
        state: "attention",
        cards: [],
      };
    const have = visibleEntities(
      job.skills,
      (s) => s.skill_display,
      "skill",
    ).filter((s) => profile.skills.some((p) => same(p, s.skill_display)));
    const missing = visibleEntities(
      job.skills,
      (s) => s.skill_display,
      "skill",
    ).filter((s) => !profile.skills.some((p) => same(p, s.skill_display)));
    return {
      state: "insight",
      text: `Mình đã đối chiếu kỹ năng trong hồ sơ với tin ${formatOccupationLabel(job.job_title)}. Đây là điểm bắt đầu để đọc kỹ yêu cầu công việc.`,
      note: "Kỹ năng trùng tên chưa đủ để xác định năng lực hoặc khả năng trúng tuyển.",
      cards: [
        {
          title: formatOccupationLabel(job.job_title),
          eyebrow: "ĐỐI CHIẾU KỸ NĂNG",
          source: `${source} Tin #${job.job_id}.`,
          rows: [
            { label: "Kỹ năng có trong hồ sơ", value: String(have.length) },
            { label: "Chưa có trong hồ sơ", value: String(missing.length) },
          ],
          skills: missing.map((s) => s.skill_display),
          skill: missing[0]?.skill_display,
        },
      ],
    };
  }
  // Do not turn unsupported salary, forecasting or readiness questions into unrelated skill advice.
  if (/luong|thu nhap|bao nhieu tien|du doan|xac suat|89%|tang.*%/.test(q))
    return {
      text: unavailable,
      note: "Mình chưa có dữ liệu đáng tin cậy để dự đoán thu nhập hay mức tăng độ phù hợp.",
      state: "attention",
      cards: [],
    };
  if (/thi truong|nhu cau|dang can|xu huong/.test(q)) {
    const { skills } = await evidence.top(profile.industry);
    const ranked = visibleEntities(skills, (s) => s.skill_display, "skill")
      .sort((a, b) => b.n_jobs - a.n_jobs)
      .slice(0, 4);
    if (!ranked.length)
      return {
        text: unavailable,
        note: "Chưa có dữ liệu kỹ năng cho ngành đang chọn.",
        state: "attention",
        cards: [],
      };
    return {
      text: "Đây là những kỹ năng được nhắc đến nhiều trong các tin của ngành bạn đang quan tâm.",
      note: "Số tin cho biết tần suất xuất hiện trong bộ dữ liệu, không phải dự báo nhu cầu tương lai.",
      state: "insight",
      cards: [
        {
          title: "Thị trường đang nhắc đến gì?",
          eyebrow: "DỮ LIỆU TUYỂN DỤNG",
          source,
          rows: ranked.map((s) => ({
            label: formatSkillLabel(s.skill_display),
            value: `${s.n_jobs.toLocaleString("vi-VN")} tin`,
          })),
        },
      ],
    };
  }
  if (/nghe nao|mo rong|gan voi ky nang/.test(q)) {
    if (!profile.skills.length)
      return {
        text: "Mình cần biết thêm những kỹ năng bạn đã có.",
        note: "Bạn có thể thêm kỹ năng hoặc tải CV trong Hồ sơ trước nhé.",
        state: "attention",
        cards: [],
      };
    const skills = [...profile.skills];
    if (q.includes("power bi") && !skills.some((s) => same(s, "Power BI")))
      skills.push("Power BI");
    const result = await evidence.match(skills);
    if (!result.matches.length)
      return {
        text: unavailable,
        note: "Chưa tìm thấy nhóm nghề có kỹ năng trùng khớp trong dữ liệu hiện có.",
        state: "attention",
        cards: [],
      };
    return {
      text: "Mình tìm thấy những nhóm nghề có kỹ năng giao với hồ sơ của bạn. Hãy xem yêu cầu từng tin trước khi chọn hướng mới.",
      state: "insight",
      cards: [
        {
          title: "Những hướng nghề để khám phá",
          eyebrow: "TỪ KỸ NĂNG ĐẾN NGHỀ",
          source,
          rows: result.matches.slice(0, 3).map((m) => ({
            label: formatOccupationLabel(m.job_title),
            value: `${m.matched_skills} kỹ năng khớp`,
          })),
          occupations: result.matches.slice(0, 3).map((m) => m.job_title),
        },
      ],
      note: "Kết quả đối chiếu kỹ năng không phải điểm phù hợp. Có Power BI cũng không tự động đủ yêu cầu của một nghề.",
    };
  }
  const skillQuestion =
    context?.kind === "skill" ||
    /sql|python|hoc truoc|hoc tiep|thieu|phu hop|ngan hon/.test(q) ||
    context?.kind === "career" ||
    context?.kind === "path";
  if (!skillQuestion)
    return {
      text: unavailable,
      note: "Mình có thể đối chiếu kỹ năng, xem nhóm nghề liên quan hoặc tra cứu kỹ năng trong dữ liệu tuyển dụng. Bạn thử một gợi ý bên dưới nhé.",
      state: "attention",
      cards: [],
    };
  const career = context?.kind === "career" ? context.value : profile.target;
  const isDemoGoal = profile.demo && same(career || "", "Financial Analyst");
  const next =
    context?.kind === "skill"
      ? context.value
      : profile.plan.find(
          (s) =>
            !profile.completed.some((c) => same(c, s)) &&
            !profile.skills.some((p) => same(p, s)),
        );
  if (isDemoGoal) {
    const gaps = demoGaps.filter(
      (g) => !profile.skills.some((s) => same(s, g.skill)),
    );
    const chosen =
      next &&
      !profile.skills.some((s) => same(s, next)) &&
      !profile.completed.some((s) => same(s, next))
        ? next
        : gaps.find((g) => !profile.completed.some((s) => same(s, g.skill)))
            ?.skill;
    const match = demoMatches.find((m) => same(m.job_title, career));
    cards.push({
      title: chosen ? formatSkillLabel(chosen) : "Kế hoạch của bạn",
      eyebrow: "LỘ TRÌNH CÁ NHÂN · DEMO",
      source:
        "Nguồn: hồ sơ demo Phương đã lưu trên máy chủ. Điểm mẫu không tự thay đổi khi thêm kỹ năng.",
      rows: [
        { label: "Độ phù hợp mẫu đã lưu", value: `${match?.fit}%` },
        {
          label: "Kỹ năng mẫu chưa có trong hồ sơ",
          value: String(gaps.length),
        },
      ],
      skills: gaps.map((g) => g.skill),
      skill: chosen,
    });
    return {
      state: "insight",
      text: chosen
        ? `Với mục tiêu ${target}, mình sẽ bắt đầu từ ${formatSkillLabel(chosen)} trong lộ trình đã chọn${profile.name ? " của " + profile.name : ""}.${same(chosen, "SQL") ? " SQL giúp bạn truy vấn và tổng hợp dữ liệu để phân tích." : ""}`
        : "Bạn đã bổ sung các kỹ năng còn thiếu trong hồ sơ mẫu. Mình sẽ cùng bạn kiểm tra yêu cầu ở từng tin tuyển dụng.",
      note: "Thứ tự này dựa trên lộ trình demo đã chọn. Hiện mình chưa có đủ dữ liệu để kết luận mức tăng độ phù hợp hoặc đây có phải đường ngắn nhất.",
      cards,
    };
  }
  if (next) {
    const { skills } = await evidence.top(profile.industry);
    const item = skills.find((s) => same(s.skill_display, next));
    cards.push({
      title: formatSkillLabel(next),
      eyebrow: "BƯỚC TRONG KẾ HOẠCH",
      source: item
        ? source
        : "Nguồn: kế hoạch học cá nhân đã lưu. Chưa có số liệu cho kỹ năng này trong kết quả tra cứu.",
      rows: item
        ? [
            {
              label: "Tin có nhắc đến kỹ năng",
              value: `${item.n_jobs.toLocaleString("vi-VN")} tin`,
            },
          ]
        : undefined,
      skill: next,
    });
    return {
      text: `${formatSkillLabel(next)} đang nằm trong kế hoạch của bạn. Mình có thể giúp bạn xem nó trên bản đồ.`,
      state: "insight",
      note:
        unavailable +
        " Chưa có mô hình xác định kỹ năng thiếu chuẩn hóa hoặc chấm điểm phù hợp cho mục tiêu này.",
      cards,
    };
  }
  return {
    text: unavailable,
    state: "attention",
    note: "Hãy chọn mục tiêu và thêm kế hoạch học; mình sẽ dùng thông tin đó để cùng bạn xem bước tiếp theo.",
    cards,
  };
}
