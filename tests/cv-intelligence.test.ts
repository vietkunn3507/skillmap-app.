import test from "node:test";
import assert from "node:assert/strict";
import {extractProfileEvidence} from "../src/server/cv-intelligence.ts";
test("CV extraction drops unsupported quotes and unverified skill labels",async()=>{
 const result=await extractProfileEvidence("Dùng Excel. Làm dashboard cho báo cáo.",new AbortController().signal,async()=>({items:[
  {kind:"skill",label:"Excel",quote:"Dùng Excel"},
  {kind:"skill",label:"Python",quote:"Có Python"},
  {kind:"skill",label:"Lưu ký năng",quote:"Dùng Excel"},
  {kind:"task",label:"Làm dashboard",quote:"Làm dashboard cho báo cáo"},
 ]}));
 assert.deepEqual(result.map(r=>r.label),["Excel","Làm dashboard"]);
});
test("CV parser redacts contact details and refuses malformed model output",async()=>{
 await assert.rejects(()=>extractProfileEvidence("Email: person@example.com. Phone: 0912345678",new AbortController().signal,async(_instructions,input)=>{
  assert.doesNotMatch(JSON.stringify(input),/person@example|0912345678/);return {items:"bad"};
 }),/INVALID_CV_EXTRACTION/);
});
