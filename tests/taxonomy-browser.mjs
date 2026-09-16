import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const context=await browser.newContext(); const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,1024,768,390]){
  await page.setViewportSize({width,height:1000});await page.goto('http://localhost:3000/login');
  if(width>=768){await page.locator('.auth-route-map').waitFor();assert.equal(await page.locator('.auth-orbit').count(),0);assert.match(await page.locator('.career-promise').innerText(),/công việc bạn mơ ước/);await page.screenshot({path:`outputs/career-journey-${width}.png`,fullPage:true});}
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow at ${width}`);
 }
 await page.getByRole('button',{name:'Dùng tài khoản demo',exact:true}).click();await page.waitForURL('**/dashboard');
 await page.route('**/api/backend/skills/top**',route=>route.fulfill({json:{industry:'ke_toan_tai_chinh',skills:[{skill_display:'Chế độ kế toán',n_jobs:999},{skill_display:'Lưu ký hàng',n_jobs:500},{skill_display:'Lưu ký năng',n_jobs:400},{skill_display:'Kế hoạch',n_jobs:300},{skill_display:'Kế toán',n_jobs:200},{skill_display:'Financial reporting',n_jobs:12},{skill_display:'Lập BCTC',n_jobs:9},{skill_display:'Báo cáo tài chính',n_jobs:11},{skill_display:'Excel',n_jobs:20},{skill_display:'Python',n_jobs:10,confidence:.1}]}}));
 await page.goto('http://localhost:3000/explore?tab=skills');await page.locator('.skill-row').first().waitFor();
 assert.equal(await page.locator('.skill-row').count(),2);await page.locator('.skill-row').getByRole('heading',{name:'Lập báo cáo tài chính',exact:true}).waitFor();
 for(const label of ['Chế độ kế toán','Lưu ký hàng','Lưu ký năng','Kế toán','Python'])assert.equal(await page.locator('.skill-row').getByRole('heading',{name:label,exact:true}).count(),0);
 assert.equal(await page.locator('.taxonomy-reference .chip').count(),7);await page.getByLabel('Chọn nghề tham khảo').selectOption('audit');assert.equal(await page.locator('.taxonomy-reference .chip').count(),6);
 await page.screenshot({path:'outputs/taxonomy-explorer-mobile.png',fullPage:true});
 await page.route('**/api/backend/skills/top**',route=>route.fulfill({json:{skills:[{skill_display:'Kế hoạch',n_jobs:500}]}}));await page.reload();await page.getByText('Chưa có dữ liệu',{exact:false}).first().waitFor();assert.equal(await page.locator('.skill-row').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS responsive journey, canonical labels, rejected phrases/confidence, alias dedup, distinct occupation relationships, filtered empty state.');
}finally{await browser.close();}
