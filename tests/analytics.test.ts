import test from 'node:test';
import assert from 'node:assert/strict';
import {api} from '../src/lib/api.ts';
test('SGI new/senior selectors partition ratios and retain original values',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({skills:[{skill:'Kỹ Năng Excel',SEI:1.76,share_junior:40.73,share_senior:23.08,n_total:1764},{skill:'Python',SEI:.5,share_junior:1,share_senior:2,n_total:20},{skill:'Word',SEI:1,share_junior:2,share_senior:2,n_total:20}]}));
 try {
  const newer=await api.gradient('ke_toan_tai_chinh','rising');
  const experienced=await api.gradient('ke_toan_tai_chinh','falling');
  assert.deepEqual(newer.skills.map(s=>s.skill),['Kỹ Năng Excel']);
  assert.equal(newer.skills[0].SEI,1.76);assert.equal(newer.skills[0].n_total,1764);
  assert.deepEqual(experienced.skills.map(s=>s.skill),['Python']);
 }finally{globalThis.fetch=original;}
});
