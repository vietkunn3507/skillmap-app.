import type { Generate } from "./mapi-llm.ts";

function backendUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
}

export async function geminiConfigured() {
  try {
    const response = await fetch(`${backendUrl()}/api/ai/mapi/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok && (await response.json()).configured === true;
  } catch {
    return false;
  }
}

// Credentials stay in FastAPI. Reuse the existing retrieval and citation guards.
export const generateGemini: Generate = async (instructions, input, schema, signal) => {
  const response = await fetch(`${backendUrl()}/api/ai/mapi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal,
    body: JSON.stringify({
      message: "Thực hiện yêu cầu dựa trên context và trả về JSON đúng schema.",
      context: input,
      instructions,
      response_schema: schema,
    }),
  });
  if (!response.ok) throw Error("GEMINI_SERVICE_UNAVAILABLE");
  const result = await response.json();
  if (typeof result.reply !== "string" || !result.reply.trim())
    throw Error("GEMINI_NO_ANSWER");
  return JSON.parse(result.reply);
};
