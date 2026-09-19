import test from "node:test";
import assert from "node:assert/strict";
import {answerWithLlm, validHistory, type Generate} from "../src/server/mapi-llm.ts";
import {demoProfile} from "../src/lib/profile-data.ts";
const plan={datasets:[],industry:"ke_toan_tai_chinh",skill:null,jobId:null,direction:"rising"};
test("general advice uses knowledge without fake citations and accepts proposed learning durations",async()=>{
 let calls=0;
 const generate:Generate=async()=>calls++===0?plan:{paragraphs:[{kind:"guidance",text:"Lịch gợi ý: học 3 buổi mỗi tuần trong 4 tuần, điều chỉnh theo thời gian của bạn.",sources:[]}],caveat:""};
 const reply=await answerWithLlm(demoProfile,"Hướng dẫn tôi học SQL",undefined,async()=>{throw Error("Should not query market")},new AbortController().signal,generate);
 assert.match(reply.text,/4 tuần/);assert.deepEqual(reply.citations,[]);assert.doesNotMatch(reply.text,/\[E/);assert.equal(reply.note,undefined);
});
test("followups receive both user questions and assistant answers; history is not numeric evidence",async()=>{
 const history=[{question:"So sánh hai cách học",answer:"Phương án thứ hai: làm dự án báo cáo."}];let calls=0;
 const generate:Generate=async(_instructions,input)=>{
 assert.deepEqual((input as {conversation:unknown}).conversation,history);
 return calls++===0?plan:{paragraphs:[{kind:"guidance",text:"Với phương án làm dự án, hãy bắt đầu từ bộ dữ liệu bán hàng giả lập.",sources:[]}],caveat:""};
 };
 const reply=await answerWithLlm(demoProfile,"Nói rõ phương án thứ hai",undefined,async()=>({}),new AbortController().signal,generate,history);
 assert.match(reply.text,/dự án/);
 assert.equal(validHistory([{question:"test",answer:"x".repeat(12001)}]),false);
});
test("market percentages cannot bypass grounding by being tagged general guidance",async()=>{
 let calls=0;const generate:Generate=async()=>calls++===0?plan:{paragraphs:[{kind:"guidance",text:"Nhu cầu SQL tăng 98%.",sources:[]}],caveat:""};
 await assert.rejects(answerWithLlm(demoProfile,"SQL ra sao",undefined,async()=>({}),new AbortController().signal,generate),/UNGROUNDED_NUMBER/);
});
