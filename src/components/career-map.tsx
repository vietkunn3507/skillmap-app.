"use client";
import { normalizeEntity, visibleEntities, visibleSkills, skillKey } from "@/lib/taxonomy";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Plus, Focus, Minus } from "lucide-react";
export interface MapNode { title: string; label?: string }
export function CareerMap({name,nodes,skills,onSelect,interactive=false,missingSkill}:{name:string;nodes:MapNode[];skills:string[];onSelect:(index:number)=>void;interactive?:boolean;missingSkill?:string}){
 const [zoom,setZoom]=useState(1);
 const occupations=visibleEntities(nodes.map((node,sourceIndex)=>({...node,sourceIndex})),n=>n.title,"occupation").slice(0,3);
 const next=missingSkill?normalizeEntity(missingSkill,"skill")?.label:undefined;
 const owned=visibleSkills(skills).filter(s=>!next||skillKey(s)!==skillKey(next)).slice(0,3);
 return <section className="career-map career-constellation" aria-label="Bản đồ nghề nghiệp cá nhân">
  <header className="constellation-heading"><div><span>BẢN ĐỒ CỦA BẠN</span><h2>Mỗi kỹ năng, một hướng đi.</h2></div><ArrowUpRight size={20} aria-hidden="true"/></header>
  <div className="constellation-viewport"><div className="constellation-scene" style={{transform:`scale(${zoom})`}}>
   <div className="constellation-halo" aria-hidden="true"/>
   <svg className="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    {occupations[0]&&<path d="M50 45 C50 32 43 25 50 13" className="constellation-primary-line"/>}
    {occupations[1]&&<path d="M50 45 C50 64 24 60 24 82"/>}
    {occupations[2]&&<path d="M50 45 C50 66 76 62 76 82"/>}
    {owned[0]&&<path d="M50 45 C32 45 34 32 16 32" className="constellation-skill-line"/>}
    {owned[1]&&<path d="M50 45 C34 46 32 58 17 58" className="constellation-skill-line"/>}
    {owned[2]&&<path d="M50 45 C63 44 63 60 83 60" className="constellation-skill-line"/>}
    {next&&<path d="M50 45 C68 45 65 34 83 34" className="constellation-next-line"/>}
   </svg>
   <Link href="/profile" className="constellation-person" aria-label={`Xem hồ sơ ${name||"của bạn"}`}><span>{name?.trim().slice(0,1)||"B"}</span><strong>{name||"Bạn"}</strong><small>Hồ sơ của bạn</small></Link>
   {occupations.map((node,i)=><button key={node.sourceIndex} className={`constellation-career constellation-career-${i}`} onClick={()=>onSelect(node.sourceIndex)}><span className="constellation-career-label">{i===0?"NGHỀ GỢI Ý":"KHÁM PHÁ THÊM"}<ArrowUpRight size={13}/></span><strong>{normalizeEntity(node.title,"occupation")?.label}</strong>{node.label&&<b>{node.label}</b>}</button>)}
   {owned.map((skill,i)=><span className={`constellation-skill constellation-skill-${i}`} key={skill}><Check size={11}/>{normalizeEntity(skill,"skill")?.label}</span>)}
   {next&&<Link href="/investment" className="constellation-next" aria-label={`Khám phá bước học tiếp theo: ${next}`}><span><Plus size={12}/>{next}</span><small>Bước tiếp theo</small></Link>}
   {!occupations.length&&<div className="constellation-empty">Thêm kỹ năng vào hồ sơ để khám phá những nghề liên quan.</div>}
  </div></div>
  <footer className="constellation-footer"><span>Chọn một nghề để khám phá</span>{interactive&&<div className="constellation-controls"><button aria-label="Thu nhỏ bản đồ" onClick={()=>setZoom(z=>Math.max(.85,z-.1))}><Minus size={14}/></button><button aria-label="Đặt lại bản đồ" onClick={()=>setZoom(1)}><Focus size={14}/></button><button aria-label="Phóng to bản đồ" onClick={()=>setZoom(z=>Math.min(1.15,z+.1))}><Plus size={14}/></button></div>}</footer>
 </section>;
}
