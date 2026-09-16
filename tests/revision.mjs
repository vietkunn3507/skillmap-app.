import { chromium, request } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = "http://localhost:3000",
  headers = { Origin: base };
const anon = await request.newContext({
  baseURL: base,
  extraHTTPHeaders: headers,
});
assert.equal((await anon.get("/api/profile")).status(), 401);
assert.equal((await anon.get("/api/cv")).status(), 401);
assert.equal((await anon.get("/api/backend/market/overview")).status(), 401);
const users = [];
for (const name of ["Isolation A", "Isolation B"]) {
  const c = await request.newContext({
    baseURL: base,
    extraHTTPHeaders: headers,
  });
  const email = `qa.${name.at(-1)}.${Date.now()}@example.invalid`;
  const r = await c.post("/api/auth/sign-up/email", {
    data: { name, email, password: "Skillmap-test-927!" },
  });
  assert.equal(r.status(), 200, await r.text());
  users.push({ c, email });
}
const [a, b] = users;
assert.equal(
  (
    await a.c.patch("/api/profile", {
      data: {
        skills: ["SQL"],
        savedSkills: ["Python"],
        plan: ["Excel"],
        whatIf: "Docker",
        user_id: "forged",
        demo: true,
      },
    })
  ).status(),
  200,
);
assert.deepEqual((await b.c.get("/api/profile")).ok(), true);
assert.deepEqual((await (await b.c.get("/api/profile")).json()).skills, []);
assert.equal((await (await a.c.get("/api/profile")).json()).demo, false);
assert.equal(
  (
    await a.c.patch("/api/profile", {
      headers: { Origin: "https://bad.invalid" },
      data: { skills: [] },
    })
  ).status(),
  403,
);
assert.equal(
  (
    await a.c.post("/api/cv", {
      multipart: {
        file: {
          name: "my-cv.txt",
          mimeType: "text/plain",
          buffer: Buffer.from(
            "My skills include SQL, Excel and Python. I build dashboards.",
          ),
        },
      },
    })
  ).status(),
  200,
);
assert.equal((await b.c.get("/api/cv")).status(), 404);
assert.equal((await a.c.post("/api/cv/analyze")).status(), 200);
assert.ok(
  (await (await a.c.get("/api/profile")).json()).skills.some(
    (s) => s.toLowerCase() === "python",
  ),
);
const cookies = (await a.c.storageState()).cookies;
assert.ok(cookies.some((c) => c.httpOnly && c.sameSite === "Lax"));
assert.equal(
  (
    await a.c.post("/api/auth/request-password-reset", {
      data: { email: a.email, redirectTo: base + "/reset-password" },
    })
  ).status(),
  200,
);
let mail;
for (let i = 0; i < 20; i++) {
  const files = await fs.readdir(".data/mail-outbox");
  for (const f of files) {
    const m = JSON.parse(await fs.readFile(".data/mail-outbox/" + f, "utf8"));
    if (m.to.toLowerCase() === a.email.toLowerCase()) mail = m;
  }
  if (mail) break;
  await new Promise((r) => setTimeout(r, 300));
}
assert.ok(mail);
const token = new URL(mail.url).pathname.split("/").at(-1);
const reset = await anon.post("/api/auth/reset-password", {
  data: { token, newPassword: "New-Skillmap-928!" },
});
assert.equal(reset.status(), 200, await reset.text());
assert.equal((await a.c.get("/api/profile")).status(), 401);
assert.notEqual(
  (
    await anon.post("/api/auth/reset-password", {
      data: { token, newPassword: "Another-Test-929!" },
    })
  ).status(),
  200,
);
assert.equal(
  (
    await a.c.post("/api/auth/sign-in/email", {
      data: { email: a.email, password: "New-Skillmap-928!" },
    })
  ).status(),
  200,
);
assert.ok(
  (await (await a.c.get("/api/profile")).json()).skills.includes("SQL"),
);
assert.equal(
  (await a.c.post("/api/auth/sign-out", { data: {} })).status(),
  200,
);
assert.equal((await a.c.get("/api/profile")).status(), 401);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(base + "/login");
await page
  .getByRole("button", { name: "Dùng tài khoản demo", exact: true })
  .click();
await page.waitForURL("**/dashboard");
await page
  .getByText("82% phù hợp với hồ sơ hiện tại", { exact: true })
  .waitFor();
const demo = await (await context.request.get(base + "/api/profile")).json();
assert.equal(demo.name, "Phương");
assert.equal(demo.cv.filename, "CV_Phuong.pdf");
assert.equal(
  (await context.request.get(base + "/api/cv")).headers()["content-type"],
  "application/pdf",
);
for (const width of [375, 768, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  for (const route of [
    "/dashboard",
    "/profile",
    "/map",
    "/explore?tab=market",
  ]) {
    await page.goto(base + route);
    await page.waitForTimeout(1400);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `overflow ${width} ${route}`,
    );
    if (route.includes("market"))
      await page.locator(".geo-bubble").first().waitFor({ timeout: 60000 });
    await page.screenshot({
      path: `work/revision-${width}-${route.split("?")[0].slice(1)}.png`,
      fullPage: true,
    });
  }
}
await page
  .getByLabel("Chọn địa điểm", { exact: true })
  .selectOption({ index: 1 });
await page.getByRole("dialog").waitFor();
await page.getByRole("button", { name: "Đóng", exact: true }).click();
await page.getByRole("button", { name: "Kỹ năng", exact: true }).last().click();
await page.getByRole("combobox", { name: "Tìm kỹ năng" }).fill("Excel");
await page.getByRole("option", { name: "Excel", exact: true }).click();
assert.deepEqual(errors, []);
await browser.close();
for (const { c } of users) await c.dispose();
await anon.dispose();
console.log(
  "PASS: auth isolation, cookies, reset/revocation, CV ownership/extraction, demo, geographic interaction, skill selector, responsive 375/768/1440",
);
