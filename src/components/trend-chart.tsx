"use client";
import { useState } from "react";
import { Info } from "lucide-react";
import { number } from "@/lib/format";
export function TrendChart({
  series,
  label,
  metric = "jobs",
}: {
  metric?: "jobs" | "employment";
  series: { year: number; share_pct: number }[];
  label: string;
}) {
  const metricLabel = metric === "jobs" ? "tin tuyển dụng" : "lao động";
  const [active, setActive] = useState<number>();
  const sorted = [...series].sort((a, b) => a.year - b.year);
  if (!sorted.length) return <p>Chưa có dữ liệu.</p>;
  const min = Math.min(...sorted.map((s) => s.year)),
    max = Math.max(...sorted.map((s) => s.year));
  const x = (year: number) =>
    40 + ((year - min) / Math.max(1, max - min)) * 400;
  const y = (v: number) => 205 - v * 1.8;
  const point = active === undefined ? undefined : sorted[active];
  return (
    <div className="chart interactive-chart">
      <div className="chart-metric">
        <span>Tỷ lệ {metricLabel} (%)</span>
        <details className="metric-info">
          <summary aria-label="Giải thích tỷ lệ">
            <Info size={17} />
          </summary>
          <p>
            {metric === "jobs"
              ? "Tỷ lệ tin có nhắc đến kỹ năng chia cho tổng số tin của ngành trong cùng năm. Một tin có thể nhắc đến nhiều kỹ năng."
              : "Tỷ trọng lao động theo cấp độ kỹ năng trong từng năm. Hai giai đoạn được tách tại thay đổi phương pháp năm 2021."}
          </p>
        </details>
      </div>
      <svg viewBox="0 0 480 245" aria-label={`${label}: tỷ lệ ${metricLabel} theo năm`}>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1="40"
              x2="442"
              y1={y(v)}
              y2={y(v)}
              stroke="#eee8f5"
              strokeDasharray="3 5"
            />
            <text x="5" y={y(v) + 4}>
              {v}%
            </text>
          </g>
        ))}
        <polyline
          points={sorted.map((s) => `${x(s.year)},${y(s.share_pct)}`).join(" ")}
          fill="none"
          stroke="#8127cf"
          strokeWidth="3"
        />
        {sorted.map((s, i) => (
          <g key={s.year}>
            <circle
              cx={x(s.year)}
              cy={y(s.share_pct)}
              r="5"
              fill="#fff"
              stroke="#8127cf"
              strokeWidth="3"
            />
            <circle
              cx={x(s.year)}
              cy={y(s.share_pct)}
              r="14"
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-label={`${s.year}, ${label}, ${number(s.share_pct)}% ${metricLabel}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setActive(i);
              }}
            />
            <text x={x(s.year)} y="234" textAnchor="middle">
              {s.year}
            </text>
          </g>
        ))}
      </svg>
      {point && (
        <div className="trend-tooltip" role="status">
          <strong>
            {point.year} · {label}
          </strong>
          <span>
            {number(point.share_pct)}% {metricLabel}
          </span>
        </div>
      )}
      <details>
        <summary>Xem bảng dữ liệu</summary>
        <table>
          <thead>
            <tr>
              <th>Năm</th>
              <th>Tỷ lệ {metricLabel}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.year}>
                <td>{s.year}</td>
                <td>{number(s.share_pct)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
