import { normalizeEntity, skillKey } from "./taxonomy.ts";
export type GrowthRow = { skill: string; start_share: number; end_share: number; change_pp: number; start_mentions: number; end_mentions: number; start_postings: number; end_postings: number };
export type GrowthData = { start: number; end: number; years: number[]; skills: GrowthRow[]; source: string; method: string };
export type Occupation = { title: string; n_jobs: number; years: { year: number; n_jobs: number }[]; skills: { label: string; job_ids: number[] }[] };
export type IntelligenceData = { occupations: Occupation[]; total_jobs: number; regions: {label: string; n_jobs: number}[]; seniority: {label: string; n_jobs: number}[]; source: string; method: string };
export const key = (label: string) => skillKey(normalizeEntity(label, "skill")?.label || label);
export function cleanGrowth(data: GrowthData) {
  const seen = new Set<string>();
  return {...data, skills: data.skills.filter(row => {
    const entity = normalizeEntity(row.skill, "skill");
    if (!entity || seen.has(key(entity.label)) || ![row.start_share,row.end_share,row.change_pp].every(Number.isFinite)) return false;
    seen.add(key(entity.label)); return true;
  }).map(row => ({...row, skill: normalizeEntity(row.skill,"skill")!.label}))};
}
export function cleanOccupations(data: IntelligenceData): IntelligenceData {
  return {...data, occupations: data.occupations.filter(o=>normalizeEntity(o.title,"occupation")).map(o=>{
    const skills = new Map<string, {label: string; job_ids: Set<number>}>();
    for (const s of o.skills) {
      const entity=normalizeEntity(s.label,"skill"); if(!entity)continue;
      const k=key(entity.label), entry=skills.get(k)||{label:entity.label,job_ids:new Set<number>()};
      s.job_ids.forEach(id=>entry.job_ids.add(id));skills.set(k,entry);
    }
    return {...o,skills:[...skills.values()].map(s=>({...s,job_ids:[...s.job_ids]}))};
  }).filter(o=>o.skills.length>0)};
}
export function coverage(occupation: Occupation, skills: string[]) {
  const have=new Set(skills.map(key));
  const total=occupation.skills.reduce((n,s)=>n+s.job_ids.length,0);
  const matched=occupation.skills.filter(s=>have.has(key(s.label)));
  return { score:total ? Math.round(100*matched.reduce((n,s)=>n+s.job_ids.length,0)/total):0,
    matched:matched.map(s=>s.label), missing:occupation.skills.filter(s=>!have.has(key(s.label))).sort((a,b)=>b.job_ids.length-a.job_ids.length).map(s=>s.label) };
}
export function priorities(occupations: Occupation[], growth: GrowthRow[], current: string[], target?: Occupation) {
  const have=new Set(current.map(key)), pool=new Map<string,{skill:string; ids:Set<number>; roles:number}>();
  for(const o of occupations)for(const s of o.skills){ const k=key(s.label);if(have.has(k))continue;const r=pool.get(k)||{skill:s.label,ids:new Set<number>(),roles:0};s.job_ids.forEach(id=>r.ids.add(id));r.roles++;pool.set(k,r); }
  const maxJobs=Math.max(1,...[...pool.values()].map(s=>s.ids.size)), maxGrowth=Math.max(1,...growth.map(s=>s.change_pp));
  return [...pool.values()].map(s=>{
    const delta=growth.find(g=>key(g.skill)===key(s.skill))?.change_pp;
    const relevant=target?.skills.some(t=>key(t.label)===key(s.skill))||false;
    const popularity=40*s.ids.size/maxJobs, goal=relevant?30:0, trend=20*Math.max(0,delta||0)/maxGrowth, breadth=10*s.roles/Math.max(1,occupations.length);
    return {skill:s.skill, n_jobs:s.ids.size,roles:s.roles, change_pp:delta, relevant, score:Math.round(popularity+goal+trend+breadth), popularity,goal,trend,breadth};
  }).sort((a,b)=>b.score-a.score||a.skill.localeCompare(b.skill));
}
export function transitionPath(occupations: Occupation[], from: string, to: string, excluded: string[]=[]): Occupation[] {
  const nodes=occupations.filter(o=>!excluded.includes(o.title));
  const start=nodes.findIndex(o=>o.title===from), end=nodes.findIndex(o=>o.title===to);
  if(start<0||end<0)return [];
  const sets=nodes.map(o=>new Set(o.skills.map(s=>key(s.label))));
  const costs=nodes.map(()=>Infinity), previous=nodes.map(()=>-1), visited=new Set<number>();costs[start]=0;
  for(let step=0;step<nodes.length;step++){
    let u=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(u<0||costs[i]<costs[u]))u=i;
    if(u<0||!Number.isFinite(costs[u]))break;if(u===end)break;visited.add(u);
    for(let v=0;v<nodes.length;v++){
      if(visited.has(v)||u===v)continue;
      const overlap=[...sets[v]].filter(s=>sets[u].has(s)).length;
      if(!overlap||overlap/(sets[u].size+sets[v].size-overlap)<0.15)continue;
      const gap=1-overlap/sets[v].size, weight=gap*gap+0.05;
      if(costs[u]+weight<costs[v]){costs[v]=costs[u]+weight;previous[v]=u;}
    }
  }
  if(!Number.isFinite(costs[end]))return [];
  const path:number[]=[];for(let u=end;u!==-1;u=previous[u])path.unshift(u);
  return path.map(i=>nodes[i]);
}
