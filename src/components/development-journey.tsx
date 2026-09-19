"use client";
import Link from "next/link";
import { ArrowUpRight, GraduationCap, UserRound, TrendingUp } from "lucide-react";
import { useProfile } from "./profile-provider";
import { useResource } from "@/lib/use-resource";
import { request } from "@/lib/api";
import { cleanGrowth, key, type GrowthData } from "@/lib/intelligence";
import { industryName } from "@/lib/format";
import { DataState } from "./ui";
import { AskMapi } from "./mapi/ask-mapi";

export function DevelopmentJourney() {
  return <section className="development-journey" aria-labelledby="development-title">
    <div className="development-intro">
      <h2 id="development-title">Hiểu thị trường. Học đúng hướng.</h2>
      <p>Kết nối nhu cầu tuyển dụng với lựa chọn học tập của mỗi người và chương trình đào tạo của nhà trường.</p>
    </div>
    <nav className="development-steps" aria-label="Khám phá giá trị SkillMAP">
      <Link href="/explore?tab=market"><span>01 · Thị trường</span><strong>Kỹ năng nào đang thay đổi?</strong><ArrowUpRight size={18}/></Link>
      <Link href="/investment"><span>02 · Cá nhân</span><strong>Tôi nên học gì tiếp theo?</strong><ArrowUpRight size={18}/></Link>
      <Link href="/organization"><span>03 · Đào tạo</span><strong>Nên bổ sung kỹ năng nào?</strong><ArrowUpRight size={18}/></Link>
    </nav>
    <div className="development-audiences">
      <Link href="/investment"><UserRound size={18}/><span>Dành cho người học & người chuyển nghề</span><ArrowUpRight size={16}/></Link>
      <Link href="/organization"><GraduationCap size={20}/><span>Dành cho trường học & tổ chức đào tạo</span><ArrowUpRight size={16}/></Link>
    </div>
  </section>;
}

export function MarketLearningBridge() {
  const {profile}=useProfile();
  const resource=useResource(`home-growth:${profile.industry}`,s=>request<GrowthData>(`/skills/growth?industry=${profile.industry}&start=2023&end=2025`,s).then(cleanGrowth));
  const rows=(resource.data?.skills||[]).filter(r=>r.change_pp>0).sort((a,b)=>b.change_pp-a.change_pp).slice(0,3);
  return <section className="card market-learning-bridge">
    
    <h2><TrendingUp size={21}/> Kỹ năng tăng tỷ trọng trong tin tuyển dụng</h2>
    <p>{industryName(profile.industry)} · So sánh 2023–2025</p>
    <DataState {...resource} empty={!rows.length}>
      <div className="bridge-skills">{rows.map(row=>{
        const held=profile.skills.some(s=>key(s)===key(row.skill));
        return <div className="bridge-skill" key={row.skill}><div><strong>{row.skill}</strong><small>{held?"Có trong hồ sơ của bạn":"Chưa ghi nhận trong hồ sơ"}</small></div><div><b>+{row.change_pp.toFixed(2)} điểm %</b><small>{row.significant?"Đạt ngưỡng p < 0,05":"Chưa đủ bằng chứng thống kê"}</small></div></div>;
      })}</div>
      <p className="source">Nguồn: TopCV · Thay đổi tỷ trọng trong mẫu tin.</p>
      <details className="data-method"><summary>Về dữ liệu</summary><p className="source">Biến động trong mẫu tin, không đại diện toàn thị trường. Kiểm định thăm dò, chưa hiệu chỉnh đa kiểm định. Đối chiếu hồ sơ theo tên kỹ năng, không đánh giá năng lực.</p></details>
    </DataState>
    <Link className="button secondary" href="/investment">Đối chiếu với hồ sơ của tôi <ArrowUpRight size={16}/></Link>
    <Link className="text-link" href="/explore?tab=market#emerging-skills">Xem toàn bộ bảng tăng / giảm →</Link>
    <AskMapi question="Dựa trên xu hướng kỹ năng và hồ sơ của tôi, tôi nên cân nhắc học gì tiếp theo? Hãy nêu nguồn và giới hạn dữ liệu." context={{kind:"career",value:profile.target||""}} />
  </section>;
}
