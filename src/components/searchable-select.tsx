"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { skillKey } from "@/lib/taxonomy";
export function SearchableSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const filtered = options
    .filter((o) => skillKey(o.label).includes(skillKey(query)))
    .slice(0, 10);
  useEffect(() => {
    function outside(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);
  function select(v: string) {
    onChange(v);
    setOpen(false);
    setQuery("");
    trigger.current?.focus();
  }
  return (
    <div className="searchable-select" ref={root}>
      <span className="select-label">{label}</span>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="select-trigger"
        onClick={() => {
          setOpen((o) => !o);
          setIndex(0);
        }}
      >
        {options.find((o) => o.value === value)?.label || "Chọn kỹ năng"}
        <ChevronDown size={18} />
      </button>
      {open && (
        <div className="select-popover">
          <label className="search-field">
            <Search size={16} />
            <input
              autoFocus
              role="combobox"
              aria-label="Tìm kỹ năng"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="skill-options"
              aria-activedescendant={
                filtered[index] ? `skill-option-${index}` : undefined
              }
              placeholder="Tìm kỹ năng..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpen(false);
                  trigger.current?.focus();
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setIndex((i) => Math.min(filtered.length - 1, i + 1));
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setIndex((i) => Math.max(0, i - 1));
                }
                if (e.key === "Enter" && filtered[index]) {
                  e.preventDefault();
                  select(filtered[index].value);
                }
              }}
            />
          </label>
          <div role="listbox" id="skill-options" aria-label="Danh sách kỹ năng">
            {filtered.map((o, i) => (
              <button
                type="button"
                role="option"
                id={`skill-option-${i}`}
                aria-selected={o.value === value}
                key={o.value}
                className={i === index ? "focused" : ""}
                onMouseEnter={() => setIndex(i)}
                onClick={() => select(o.value)}
              >
                {o.label}
                {o.value === value && <Check size={16} />}
              </button>
            ))}
            {!filtered.length && <p>Không tìm thấy kỹ năng.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
