"use client";
import { Mapi } from "./mascot";
import { useProfile } from "../profile-provider";
import { mapiHref } from "@/lib/mapi";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  formatSkillLabel,
  formatOccupationLabel,
  skillKey,
} from "@/lib/taxonomy";
export function HomeMapiInsight() {
  const { profile } = useProfile();
  const next = profile.plan.find(
    (s) =>
      !profile.completed.some((c) => skillKey(c) === skillKey(s)) &&
      !profile.skills.some((c) => skillKey(c) === skillKey(s)),
  );
  const question = next
    ? `Tại sao tôi nên học ${next}?`
    : "Thị trường đang cần kỹ năng gì?";
  return (
    <article className="home-mapi-insight">
      <Mapi state="insight" size={65} />
      <div>
        
        <h2>
          {next
            ? `Nên học tiếp: ${formatSkillLabel(next)}`
            : "Khám phá từ kỹ năng của bạn"}
        </h2>
        <p>
          {next
            ? `${formatSkillLabel(next)} là bước tiếp theo trong lộ trình ${formatOccupationLabel(profile.target || "đã chọn")} của bạn.`
            : "Cùng mình xem những kỹ năng được nhắc đến trong dữ liệu tuyển dụng."}
        </p>
        {profile.demo && next && (
          <span className="mapi-demo-label">Theo lộ trình demo đã lưu</span>
        )}
        <Link
          href={mapiHref(
            question,
            next ? { kind: "skill", value: next } : undefined,
          )}
          className="text-link"
        >
          Xem vì sao
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}
