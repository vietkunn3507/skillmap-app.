"use client";
import { useState } from "react";
import { ArrowDown, Plus, Check } from "lucide-react";
import { occupationSkills, normalizeEntity } from "@/lib/taxonomy";
import { useProfile } from "./profile-provider";

export function OccupationSkills() {
  const [selected, setSelected] =
    useState<keyof typeof occupationSkills>("accounting");
  const { profile, update } = useProfile();
  const occupation = occupationSkills[selected];
  return (
    <section className="card taxonomy-reference">
      <span className="eyebrow">KHUNG KỸ NĂNG THAM KHẢO</span>
      <h2>Nghề này cần những kỹ năng gì?</h2>
      <label>
        <span className="entity-kind">Nghề nghiệp</span>
        <select
          value={selected}
          onChange={(e) =>
            setSelected(e.target.value as keyof typeof occupationSkills)
          }
          aria-label="Chọn nghề tham khảo"
        >
          {Object.entries(occupationSkills).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </label>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <ArrowDown size={18} aria-hidden="true" />
        <span className="entity-kind">Kỹ năng liên quan</span>
      </div>
      <div
        className="chips"
        aria-label={`Kỹ năng liên quan đến ${occupation.label}`}
      >
        {occupation.skills.map((skill) => {
          const has = profile.skills.some(
            (s) => normalizeEntity(s, "skill")?.label === skill,
          );
          const planned = profile.plan.some(
            (s) => normalizeEntity(s, "skill")?.label === skill,
          );
          return (
            <button
              className="chip"
              key={skill}
              disabled={has || planned}
              onClick={() => update({ plan: [...profile.plan, skill] })}
              aria-label={`${has ? "Đã có" : planned ? "Trong kế hoạch" : "Thêm vào kế hoạch"}: ${skill}`}
            >
              {has || planned ? <Check size={13} /> : <Plus size={13} />}{" "}
              {skill}
            </button>
          );
        })}
      </div>
      <p className="source">
        Khung tham khảo được biên soạn cho từng nghề, không phải số liệu thị
        trường hay kết quả phân tích hồ sơ. Chọn kỹ năng để thêm vào kế hoạch
        học.
      </p>
    </section>
  );
}
