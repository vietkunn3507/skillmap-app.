export type MapiContext = {
  kind: "career" | "skill" | "path" | "job";
  value: string;
};
export type MapiCard = {
  title: string;
  eyebrow: string;
  source: string;
  rows?: { label: string; value: string }[];
  skills?: string[];
  occupations?: string[];
  skill?: string;
};
export type MapiReply = {
  engine?: "llm" | "guided";
  citations?: { id: string; label: string; href: string }[];
  text: string;
  note?: string;
  state: "insight" | "attention";
  cards: MapiCard[];
};
export function mapiHref(question: string, context?: MapiContext) {
  const q = new URLSearchParams({ q: question });
  if (context) {
    q.set("context", context.kind);
    q.set("value", context.value);
  }
  return "/ai?" + q.toString();
}
