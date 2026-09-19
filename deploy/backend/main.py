"""
SkillShift VN - API backend
Chay: uvicorn main:app --reload --port 8000
Docs tu dong: http://localhost:8000/docs
"""
import sqlite3
import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

DB_PATH = os.getenv("MARKET_DB_PATH", "skillshift.db")

app = FastAPI(
    title="SkillShift VN API",
    description="API du lieu thi truong lao dong Viet Nam - 2 nganh Ke toan/Tai chinh va IT/Data",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


def q(sql, params=()):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


VALID_INDUSTRIES = {"ke_toan_tai_chinh", "it_data"}


def check_industry(industry: Optional[str]):
    if industry and industry not in VALID_INDUSTRIES:
        raise HTTPException(400, f"industry phai la mot trong {VALID_INDUSTRIES}")


# ---------------------------------------------------------------------------
# 1) TONG QUAN THI TRUONG
# ---------------------------------------------------------------------------
@app.get("/api/market/overview")
def market_overview():
    """So lieu tong quan: tong tin, so ky nang, khoang thoi gian du lieu."""
    total_jobs = q("SELECT COUNT(*) n FROM jobs")[0]["n"]
    by_industry = q("SELECT industry, COUNT(*) n FROM jobs GROUP BY industry")
    by_year = q("SELECT year, industry, COUNT(*) n FROM jobs GROUP BY year, industry ORDER BY year")
    total_skills = q("SELECT COUNT(*) n FROM skills")[0]["n"]
    return {
        "total_jobs": total_jobs,
        "total_skills": total_skills,
        "by_industry": by_industry,
        "by_year_industry": by_year,
        "data_source": "TopCV (crawl thang 9/2026, tin dang tu 2023-2026)",
    }


# ---------------------------------------------------------------------------
# 2) KY NANG PHO BIEN NHAT (snapshot hien tai)
# ---------------------------------------------------------------------------
@app.get("/api/skills/top")
def top_skills(
    industry: Optional[str] = Query(None, description="ke_toan_tai_chinh | it_data"),
    limit: int = Query(20, ge=1, le=100),
):
    check_industry(industry)
    where = "WHERE j.industry = ?" if industry else ""
    params = (industry,) if industry else ()
    rows = q(f"""
        SELECT s.skill_display, s.esco_label, COUNT(*) n_jobs
        FROM job_skills js
        JOIN jobs j ON j.job_id = js.job_id
        JOIN skills s ON s.skill_id = js.skill_id
        {where}
        GROUP BY s.skill_id
        ORDER BY n_jobs DESC
        LIMIT ?
    """, params + (limit,))
    return {"industry": industry or "ca_hai_nganh", "skills": rows}


# ---------------------------------------------------------------------------
# 3) XU HUONG KY NANG THEO NAM (du lieu that, TopCV 2023-2026)
# ---------------------------------------------------------------------------
@app.get("/api/skills/trend")
def skill_trend(
    industry: str = Query(..., description="ke_toan_tai_chinh | it_data"),
    skill: Optional[str] = Query(None, description="Loc theo 1 ky nang cu the (skill_canonical)"),
    top_n: int = Query(10, ge=1, le=50, description="Neu khong chi dinh skill, lay top N theo tong so lan nhac toi"),
):
    """Tra ve chuoi % tin nhac toi tung ky nang qua cac nam, dung de ve line chart."""
    check_industry(industry)
    if skill:
        rows = q("""
            SELECT year, skill_canonical, share_pct, n_mentions, n_postings
            FROM skill_trend_yearly WHERE industry=? AND skill_canonical=?
            ORDER BY year
        """, (industry, skill))
        if not rows:
            raise HTTPException(404, "Khong co du lieu cho ky nang nay")
        return {"industry": industry, "skill": skill, "series": rows}

    top_skills_ = q("""
        SELECT skill_canonical, SUM(n_mentions) total
        FROM skill_trend_yearly WHERE industry=?
        GROUP BY skill_canonical ORDER BY total DESC LIMIT ?
    """, (industry, top_n))
    result = []
    for s in top_skills_:
        series = q("""
            SELECT year, share_pct, n_mentions, n_postings
            FROM skill_trend_yearly WHERE industry=? AND skill_canonical=?
            ORDER BY year
        """, (industry, s["skill_canonical"]))
        result.append({"skill": s["skill_canonical"], "series": series})
    return {"industry": industry, "skills": result}


# ---------------------------------------------------------------------------
# 4) THANG BAC KY NANG THEO KINH NGHIEM (SGI - tu VietJobs)
# ---------------------------------------------------------------------------
@app.get("/api/skills/seniority-gradient")
def seniority_gradient(
    industry: str = Query(..., description="Tài chính - Kế toán | IT - Data"),
    direction: str = Query("rising", pattern="^(rising|falling)$"),
    limit: int = Query(15, ge=1, le=50),
):
    """SGI > 1: ky nang nghieng ve nhom tre (0-3 nam).
    SGI < 1: ky nang nghieng ve nhom lau nam (>3 nam), thuong la ky nang phan doan/quan ly."""
    order = "DESC" if direction == "rising" else "ASC"
    rows = q(f"""
        SELECT skill, n_total, "share_tre_%" as share_junior,
               "share_launam_%" as share_senior, SEI
        FROM skill_seniority_gradient
        WHERE industry = ?
        ORDER BY SEI {order}
        LIMIT ?
    """, (industry, limit))
    return {"industry": industry, "direction": direction, "skills": rows}


# ---------------------------------------------------------------------------
# 5) DOI CHIEU VI MO QUOC GIA (ILOSTAT)
# ---------------------------------------------------------------------------
@app.get("/api/macro/skill-level-trend")
def macro_skill_level_trend():
    """Ty trong viec lam ca nuoc theo cap do ky nang, 2007-2024 (ILOSTAT).
    LUU Y: co dut gay phuong phap nam 2021 (doi chuan ICLS), khong noi suy qua moc nay."""
    rows = q("""
        SELECT year, skill_level, employment_thousands, share_pct
        FROM macro_skill_level_trend ORDER BY year
    """)
    return {
        "rows": rows,
        "warning": "Dut gay phuong phap thong ke nam 2021 (chuyen chuan ICLS). "
                   "Chi so sanh noi bo giai doan 2010-2019 hoac 2021-2024, khong noi suy xuyen qua 2020/2021.",
    }


# ---------------------------------------------------------------------------
# 6) DANH SACH TIN TUYEN DUNG (loc theo nganh / nam / ky nang)
# ---------------------------------------------------------------------------
@app.get("/api/jobs")
def list_jobs(
    industry: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    skill: Optional[str] = Query(None, description="skill_canonical"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    check_industry(industry)
    where, params = [], []
    if industry:
        where.append("j.industry = ?"); params.append(industry)
    if year:
        where.append("j.year = ?"); params.append(year)
    join = ""
    if skill:
        join = "JOIN job_skills js ON js.job_id = j.job_id JOIN skills s ON s.skill_id = js.skill_id"
        where.append("s.skill_canonical = ?"); params.append(skill)
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""
    rows = q(f"""
        SELECT DISTINCT j.job_id, j.job_title, j.company_name, j.industry,
               j.location, j.seniority, j.experience_required,
               j.salary_min, j.salary_max, j.posted_date, j.year
        FROM jobs j {join} {where_sql}
        ORDER BY j.posted_date DESC LIMIT ? OFFSET ?
    """, tuple(params) + (limit, offset))
    return {"jobs": rows, "limit": limit, "offset": offset}


@app.get("/api/jobs/{job_id}")
def job_detail(job_id: int):
    rows = q("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
    if not rows:
        raise HTTPException(404, "Khong tim thay tin nay")
    job = rows[0]
    skills = q("""
        SELECT s.skill_display, s.esco_label FROM job_skills js
        JOIN skills s ON s.skill_id = js.skill_id WHERE js.job_id = ?
    """, (job_id,))
    job["skills"] = skills
    return job


# ---------------------------------------------------------------------------
# 7) CAREER MATCHING DON GIAN (demo): nhap danh sach ky nang -> goi y nganh/vi tri phu hop
# ---------------------------------------------------------------------------
@app.post("/api/career/match")
def career_match(skills_input: list[str]):
    """Demo don gian: dem so tin tuyen dung khop voi tung ky nang nguoi dung nhap,
    xep hang theo job_category co do phu hop cao nhat. Khong dung LLM, chi dem theo du lieu that."""
    if not skills_input:
        raise HTTPException(400, "Can it nhat 1 ky nang")
    placeholders = ",".join("?" for _ in skills_input)
    rows = q(f"""
        SELECT j.job_title, j.industry, COUNT(DISTINCT s.skill_id) matched_skills,
               COUNT(DISTINCT js.job_id) n_similar_jobs
        FROM skills s
        JOIN job_skills js ON js.skill_id = s.skill_id
        JOIN jobs j ON j.job_id = js.job_id
        WHERE s.skill_display IN ({placeholders}) OR s.skill_canonical IN ({placeholders})
        GROUP BY j.job_title
        ORDER BY matched_skills DESC, n_similar_jobs DESC
        LIMIT 15
    """, tuple(skills_input) * 2)
    return {"input_skills": skills_input, "matches": rows}


@app.get("/")
def root():
    return {
        "message": "SkillShift VN API",
        "docs": "/docs",
        "endpoints": [
            "/api/market/overview", "/api/skills/top", "/api/skills/trend",
            "/api/skills/seniority-gradient", "/api/macro/skill-level-trend",
            "/api/jobs", "/api/jobs/{job_id}", "/api/career/match (POST)",
            "/api/ai/mapi (POST)",
        ],
    }


class MapiRequest(BaseModel):
    message: str
    context: dict | None = None
    response_schema: dict | None = None
    instructions: str | None = None


@app.get("/api/ai/mapi/status")
def mapi_status():
    return {"configured": gemini_client is not None, "provider": "gemini"}


@app.post("/api/ai/mapi")
def ask_mapi(request: MapiRequest):
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini API chưa được cấu hình.")

    system_instruction = """
Bạn là Mapi, trợ lý nghề nghiệp AI của SkillMAP.

Nhiệm vụ:
- Trả lời bằng tiếng Việt tự nhiên, rõ ràng. Điều chỉnh độ sâu theo câu hỏi; phân tích cần giải thích, ví dụ và hành động cụ thể.
- Cá nhân hóa theo hồ sơ được cung cấp; không mặc định mọi người đều là người dùng demo.
- Số liệu và nhận xét về thị trường/hồ sơ phải dựa trên context. Có thể dùng kiến thức chung để giải thích, tư vấn, soạn nội dung và đề xuất kế hoạch; phân biệt gợi ý với dữ liệu quan sát.
- Không tự bịa số liệu thị trường, mức lương, nhu cầu tuyển dụng,
  điểm phù hợp hoặc khoảng cách kỹ năng.
- Nếu thiếu bằng chứng cho kết luận định lượng, nêu giới hạn ngắn gọn rồi giúp người dùng bằng kiến thức hoặc phương án tham khảo phù hợp.
- Ưu tiên giải thích dễ hiểu cho sinh viên và người trẻ.
- Không viết đoạn văn quá dài.
- Có thể đề xuất hành động tiếp theo nếu dữ liệu hỗ trợ.
"""
    context_text = json.dumps(request.context or {}, ensure_ascii=False, indent=2)
    user_prompt = f"""
Dữ liệu SkillMAP hiện có:

{context_text}

Câu hỏi của người dùng:
{request.message}

Hãy trả lời dựa trên dữ liệu trên.
"""
    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction + "\n" + (request.instructions or ""),
                temperature=0.3,
                max_output_tokens=(6500 if "paragraphs" in (request.response_schema or {}).get("properties", {}) else 2200) if request.response_schema else 5000,
                response_mime_type="application/json" if request.response_schema else "text/plain",
                response_json_schema=request.response_schema,
            ),
        )
        if not response.text:
            raise HTTPException(status_code=502, detail="Mapi chưa tạo được câu trả lời. Vui lòng thử lại.")
        return {"reply": response.text}
    except HTTPException:
        raise
    except Exception as e:
        # Never expose a configured credential in a provider error.
        detail = str(e).replace(GEMINI_API_KEY, "[redacted]") if GEMINI_API_KEY else str(e)
        raise HTTPException(status_code=500, detail=f"Lỗi khi gọi Mapi: {detail}") from e


from intelligence import router as intelligence_router
app.include_router(intelligence_router)
