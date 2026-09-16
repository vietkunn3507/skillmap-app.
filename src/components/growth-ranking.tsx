"use client";
import { useState } from "react";
import { request } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { cleanGrowth, type GrowthData } from "@/lib/intelligence";
import type { Industry } from "@/lib/types";
import { DataState } from "./ui";
import { useProfile } from "./profile-provider";
import { key } from "@/lib/intelligence";
export function GrowthRanking({industry}: {industry:Industry}) {
 const [start,setStart]=useState(2023),[end,setEnd]=useState(2025),[direction,setDirection]=useState("up");
 const data=useResource(`growth:${industry}:${start}:${end}`,s=>request<GrowthData>(`/skills/growth?industry=${industry}&start=${start}&end=${end}`,s).then(cleanGrowth));
 const {profile,update}=useProfile();
 const rows=(data.data?.skills||[]).filter(r=>direction==="up"?r.change_pp>0:r.change_pp<0).sort((a,b)=>direction==="up"?b.change_pp-a.change_pp:a.change_pp-b.change_pp).slice(0,10);
 const years=data.data?.years||[2023,2024,2025,2026];
 return <section className="card" id="emerging-skills"><span className="eyebrow">EMERGING SKILLS · TOPCV</span><h2>Kỹ năng tăng nhanh nhất</h2><p>Xếp hạng tăng / giảm tỷ trọng tin, không phải dự báo thị trường.</p>
 <div className="intel-controls"><label>Từ năm<select value={start} onChange={e=>setStart(Number(e.target.value))}>{years.filter(y=>y<end).map(y=><option key={y}>{y}</option>)}</select></label><label>Đến năm<select value={end} onChange={e=>setEnd(Number(e.target.value))}>{years.filter(y=>y>start).map(y=><option key={y}>{y}</option>)}</select></label><label>Xếp hạng<select value={direction} onChange={e=>setDirection(e.target.value)}><option value="up">Tăng mạnh nhất</option><option value="down">Giảm mạnh nhất</option></select></label></div>
 <DataState {...data} empty={!rows.length}><div className="intel-table"><table><thead><tr><th>Kỹ năng</th><th>{start}</th><th>{end}</th><th>Đổi (điểm %)</th><th>Học</th></tr></thead><tbody>{rows.map(r=><tr key={r.skill}><td>{r.skill}</td><td>{r.start_share.toFixed(2)}%</td><td>{r.end_share.toFixed(2)}%</td><td className={r.change_pp>0?"positive":"negative"}>{r.change_pp>0?"+":""}{r.change_pp.toFixed(2)}</td><td><button className="chip" disabled={[...profile.plan,...profile.skills].some(s=>key(s)===key(r.skill))} onClick={()=>update({plan:[...profile.plan,r.skill]})}>Thêm</button></td></tr>)}</tbody></table></div></DataState>
 <p className="source">{data.data?.method} Toàn bộ chuỗi trong ngành được xét trước khi lọc nhãn và xếp hạng. Hai năm có cỡ mẫu khác nhau; tỷ trọng không phải tốc độ tăng số việc làm. Năm 2026 chưa đủ năm.</p></section>;
}
