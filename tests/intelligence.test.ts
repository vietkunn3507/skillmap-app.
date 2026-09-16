import test from "node:test";
import assert from "node:assert/strict";
import {cleanGrowth,cleanOccupations,coverage,priorities,transitionPath,type Occupation} from "../src/lib/intelligence.ts";
const role=(title:string,labels:string[]):Occupation=>({title,n_jobs:2,years:[],skills:labels.map(label=>({label,job_ids:[1,2]}))});
test("normalization unions job evidence for aliases, never sums duplicated postings",()=>{
 const raw={occupations:[{...role("Data Analyst",[]),skills:[{label:"Excel",job_ids:[1,2]},{label:"Microsoft Excel",job_ids:[2,3]},{label:"Lưu ký năng",job_ids:[1]}]}],total_jobs:3,source:"test",method:"test",regions:[],seniority:[]};
 const cleaned=cleanOccupations(raw);assert.equal(cleaned.occupations[0].skills.length,1);assert.equal(cleaned.occupations[0].skills[0].job_ids.length,3);
});
test("growth preserves percentage point observations and drops malformed labels",()=>{
 const base={start_share:10,end_share:15,change_pp:5,start_mentions:10,end_mentions:30,start_postings:100,end_postings:200};
 const result=cleanGrowth({start:2023,end:2025,years:[2023,2025],source:"test",method:"test",skills:[{...base,skill:"Excel"},{...base,skill:"Lưu ký năng"}]});assert.equal(result.skills.length,1);assert.equal(result.skills[0].change_pp,5);
});
test("what-if coverage increases only from evidence skills; unrelated skills do nothing",()=>{
 const o=role("Data Analyst",["Excel","SQL"]);assert.equal(coverage(o,["Excel"]).score,50);assert.equal(coverage(o,["Excel","SQL"]).score,100);assert.equal(coverage(o,["Excel","Java"]).score,50);
});
test("priority excludes held skills and does not fabricate missing trend observations",()=>{
 const roles=[role("Data Analyst",["Excel","SQL"])];const ranked=priorities(roles,[],["Excel"],roles[0]);assert.equal(ranked.length,1);assert.equal(ranked[0].skill,"SQL");assert.equal(ranked[0].change_pp,undefined);assert.equal(ranked[0].trend,0);assert.ok(ranked[0].score<=100);
});
test("Dijkstra discovers a real intermediate node and rejects disconnected occupations",()=>{
 const a=role("Accountant",["Excel","Accounting"]),b=role("Business Analyst",["Excel","Accounting","SQL","Power BI"]),c=role("Data Analyst",["SQL","Power BI"]),d=role("Java Engineer",["Java"]);
 assert.deepEqual(transitionPath([a,b,c,d],a.title,c.title).map(o=>o.title),[a.title,b.title,c.title]);
 assert.deepEqual(transitionPath([a,b,c,d],a.title,d.title),[]);
 assert.deepEqual(transitionPath([a,b,c,d],a.title,c.title,[b.title]),[]);
});
