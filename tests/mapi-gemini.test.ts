import test from "node:test";
import assert from "node:assert/strict";
import { generateGemini, geminiConfigured } from "../src/server/mapi-gemini.ts";

test("Gemini adapter sends structured evidence to FastAPI without browser credentials", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, init) => {
      assert.match(String(url), /\/api\/ai\/mapi$/);
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body.context, { question: "SQL?" });
      assert.deepEqual(body.response_schema, { type: "object" });
      assert.equal(new Headers(init?.headers).has("Authorization"), false);
      return Response.json({ reply: '{"ok":true}' });
    };
    assert.deepEqual(await generateGemini("Use evidence", { question: "SQL?" }, { type: "object" }, new AbortController().signal), { ok: true });
    globalThis.fetch = async () => Response.json({ detail: "Provider failed" }, { status: 500 });
    await assert.rejects(() => generateGemini("", {}, {}, new AbortController().signal), /GEMINI_SERVICE_UNAVAILABLE/);
    assert.equal(await geminiConfigured(), false);
    globalThis.fetch = async () => Response.json({ reply: "not json" });
    await assert.rejects(() => generateGemini("", {}, {}, new AbortController().signal));
  } finally {
    globalThis.fetch = original;
  }
});
