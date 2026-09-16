"use client";
import { useId } from "react";
export type MapiState =
  | "neutral"
  | "greeting"
  | "thinking"
  | "insight"
  | "success"
  | "attention";
export function Mapi({
  state = "neutral",
  size = 64,
  className = "",
  decorative = false,
}: {
  state?: MapiState;
  size?: number;
  className?: string;
  decorative?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const happy = state === "greeting" || state === "success";
  return (
    <span
      className={`mapi mapi-${state} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        role={decorative ? undefined : "img"}
        aria-hidden={decorative || undefined}
        aria-label={
          decorative
            ? undefined
            : `Mapi · ${{ neutral: "đồng hành", greeting: "chào bạn", thinking: "đang suy nghĩ", insight: "có một gợi ý", success: "đã xong", attention: "cần chú ý" }[state]}`
        }
      >
        <defs>
          <linearGradient id={`${id}-body`} x1=".1" y1="0" x2=".85" y2="1">
            <stop stopColor="#eee4ff" />
            <stop offset=".5" stopColor="#c7a4f0" />
            <stop offset="1" stopColor="#8a51c1" />
          </linearGradient>
          <linearGradient id={`${id}-rim`} x1="0" x2="1" y2="1">
            <stop stopColor="#fff" />
            <stop offset="1" stopColor="#c8a4f0" />
          </linearGradient>
          <radialGradient id={`${id}-glow`}>
            <stop stopColor="#a47acf" stopOpacity=".25" />
            <stop offset="1" stopColor="#a47acf" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="59" cy="105" rx="36" ry="9" fill={`url(#${id}-glow)`} />
        <g className="mapi-body">
          <path
            d="M55 12C72 7 82 18 93 31C106 45 105 65 96 82C87 99 73 104 54 101C34 99 20 88 16 71C12 54 19 37 33 24C40 18 47 15 55 12Z"
            fill={`url(#${id}-body)`}
            stroke={`url(#${id}-rim)`}
            strokeWidth="2"
          />
          <path
            d="M29 47C34 27 55 17 72 22"
            fill="none"
            stroke="white"
            strokeOpacity=".55"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M72 16L87 25L68 35L72 16Z"
            fill="#ff927b"
            stroke="#ffe5dc"
            strokeWidth="1.5"
          />
          <path d="M72 16L68 35L63 26Z" fill="#ec735f" />
          <g
            className="mapi-eyes"
            fill="#392052"
            stroke="#392052"
            strokeWidth="3.5"
            strokeLinecap="round"
          >
            {happy ? (
              <>
                <path d="M37 60Q42 54 47 60" fill="none" />
                <path d="M65 60Q70 54 75 60" fill="none" />
              </>
            ) : (
              <>
                <ellipse
                  cx={state === "thinking" ? 44 : 42}
                  cy="59"
                  rx="3.4"
                  ry={state === "attention" ? 6 : 5}
                  stroke="none"
                />
                <ellipse
                  cx={state === "thinking" ? 72 : 70}
                  cy="59"
                  rx="3.4"
                  ry={state === "attention" ? 6 : 5}
                  stroke="none"
                />
              </>
            )}
          </g>
          <path
            d={state === "attention" ? "M54 74L60 74" : "M52 72Q57 77 63 71"}
            fill="none"
            stroke="#674178"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <ellipse
            cx="32"
            cy="71"
            rx="5"
            ry="2.5"
            fill="#ffab9e"
            opacity=".55"
          />
          {state === "greeting" && (
            <path
              d="M97 59Q114 56 111 45"
              fill="none"
              stroke="#ba92e1"
              strokeWidth="9"
              strokeLinecap="round"
            />
          )}
        </g>
        {state === "insight" && (
          <path
            d="M103 8L106 17L115 20L106 23L103 32L100 23L91 20L100 17Z"
            fill="#f79579"
          />
        )}
        {state === "success" && (
          <g>
            <circle
              cx="97"
              cy="91"
              r="14"
              fill="#e9f2e8"
              stroke="white"
              strokeWidth="2"
            />
            <path
              d="M91 91L95 95L103 86"
              fill="none"
              stroke="#427256"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
        {state === "attention" && (
          <g>
            <circle
              cx="98"
              cy="89"
              r="13"
              fill="#fff0db"
              stroke="white"
              strokeWidth="2"
            />
            <path
              d="M98 82V89M98 95V95.2"
              stroke="#a6672e"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        )}
        {state === "thinking" && (
          <g fill="#8751bf" className="mapi-thoughts">
            <circle cx="86" cy="16" r="3" />
            <circle cx="98" cy="13" r="3" />
            <circle cx="110" cy="16" r="3" />
          </g>
        )}
      </svg>
    </span>
  );
}
