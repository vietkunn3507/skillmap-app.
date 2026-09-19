"""Read-only analytics over existing observations; no imputed market values."""
import os
import sqlite3
from fastapi import APIRouter, HTTPException, Query
from scipy.stats import chi2_contingency, fisher_exact
import numpy as np

router = APIRouter(prefix="/api")

def rows(sql, params=()):
    path = os.getenv("MARKET_DB_PATH", "skillshift.db")
    connection = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        return [dict(r) for r in connection.execute(sql, params)]
    finally:
        connection.close()

def check(industry):
    if industry not in ("it_data", "ke_toan_tai_chinh"):
        raise HTTPException(422, "Ngành không hợp lệ")

def significance(x1, n1, x2, n2):
    """Kiem dinh 2 ty le doc lap (chi-square, chuyen Fisher khi ky vong < 5).
    Tra ve (p_value, significant o muc 5%)."""
    table = [[x1, n1 - x1], [x2, n2 - x2]]
    try:
        chi2, p, _, expected = chi2_contingency(table)
        if (np.array(expected) < 5).any():
            _, p = fisher_exact(table)
    except ValueError:
        return None, False
    return round(float(p), 4), bool(p < 0.05)

@router.get("/skills/growth")
def growth(industry: str, start: int = Query(2023, ge=2000, le=2100), end: int = Query(2025, ge=2000, le=2100)):
    check(industry)
    if start >= end:
        raise HTTPException(422, "Năm kết thúc phải sau năm bắt đầu")
    years = [r["year"] for r in rows("SELECT DISTINCT year FROM skill_trend_yearly WHERE industry=? ORDER BY year", (industry,))]
    data = rows("""SELECT a.skill_canonical AS skill, a.share_pct AS start_share,
        b.share_pct AS end_share, a.n_mentions AS start_mentions, b.n_mentions AS end_mentions,
        a.n_postings AS start_postings, b.n_postings AS end_postings,
        ROUND(b.share_pct-a.share_pct, 2) AS change_pp
        FROM skill_trend_yearly a JOIN skill_trend_yearly b
        ON a.industry=b.industry AND a.skill_canonical=b.skill_canonical
        WHERE a.industry=? AND a.year=? AND b.year=?
        ORDER BY change_pp DESC, a.skill_canonical""", (industry, start, end))
    for row in data:
        p, sig = significance(row["start_mentions"], row["start_postings"],
                               row["end_mentions"], row["end_postings"])
        row["p_value"] = p
        row["significant"] = sig
    return {"industry": industry, "start": start, "end": end, "years": years, "skills": data,
        "source": "TopCV · skill_trend_yearly",
        "method": "change_pp = share_pct cuối kỳ − đầu kỳ. Chỉ so sánh kỹ năng có quan sát ở cả hai năm; "
                  "không điền 0 cho dữ liệu thiếu. significant = kiểm định chi-square (Fisher khi kỳ vọng "
                  "< 5) đạt p < 0.05. Không đạt ngưỡng nghĩa là chưa đủ bằng chứng thống kê, "
                  "không chứng minh không có thay đổi. Kiểm định thăm dò, chưa hiệu chỉnh đa kiểm định; mẫu tin không đại diện toàn thị trường."}

@router.get("/intelligence/occupations")
def occupations(industry: str):
    check(industry)
    jobs = rows("SELECT job_id, job_title, year, location, seniority FROM jobs WHERE industry=?", (industry,))
    skill_rows = rows("""SELECT DISTINCT j.job_title, s.skill_display, j.job_id
        FROM jobs j JOIN job_skills js ON j.job_id=js.job_id
        JOIN skills s ON s.skill_id=js.skill_id WHERE j.industry=?""", (industry,))
    grouped = {}
    for job in jobs:
        title = job["job_title"]
        group = grouped.setdefault(title, {"title": title, "job_ids": set(), "skills": {}, "years": {}})
        group["job_ids"].add(job["job_id"])
        group["years"].setdefault(job["year"], set()).add(job["job_id"])
    for item in skill_rows:
        grouped[item["job_title"]]["skills"].setdefault(item["skill_display"], set()).add(item["job_id"])
    result = [{"title": g["title"], "n_jobs": len(g["job_ids"]),
        "years": [{"year": y, "n_jobs": len(ids)} for y, ids in sorted(g["years"].items())],
        "skills": [{"label": label, "job_ids": sorted(ids)} for label, ids in g["skills"].items()]}
        for g in grouped.values()]
    return {"industry": industry, "total_jobs": len({j["job_id"] for j in jobs}),
        "occupations": sorted(result, key=lambda g: (-g["n_jobs"], g["title"])),
        "seniority": rows("SELECT seniority AS label, COUNT(DISTINCT job_id) AS n_jobs FROM jobs WHERE industry=? GROUP BY seniority ORDER BY n_jobs DESC", (industry,)),
        "regions": rows("SELECT location AS label, COUNT(DISTINCT job_id) AS n_jobs FROM jobs WHERE industry=? GROUP BY location ORDER BY n_jobs DESC", (industry,)),
        "source": "TopCV · jobs + job_skills", "method": "Nhóm theo tiêu đề tuyển dụng gốc, chưa phải nhóm nghề ISCO. Nhãn địa điểm nhiều nơi được giữ nguyên, không cộng thành tổng tỉnh."}
