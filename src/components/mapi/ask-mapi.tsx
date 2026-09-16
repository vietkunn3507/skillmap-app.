"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Mapi } from "./mascot";
import { mapiHref, type MapiContext } from "@/lib/mapi";
export function AskMapi({
  question,
  context,
  floating = false,
  onClick,
}: {
  question: string;
  context: MapiContext;
  floating?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={mapiHref(question, context)}
      onClick={onClick}
      className={floating ? "mapi-floating" : "mapi-context-link"}
      aria-label={`Hỏi Mapi: ${question}`}
    >
      <Mapi size={floating ? 48 : 42} decorative />
      <span>
        {floating ? "Hỏi Mapi" : question}
        <small>{floating ? "Về lộ trình này" : "Hỏi Mapi"}</small>
      </span>
      <ArrowUpRight size={16} />
    </Link>
  );
}
