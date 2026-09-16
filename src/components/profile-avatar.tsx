"use client";
export function ProfileAvatar({
  name = "Phương",
  size = 44,
}: {
  name?: string;
  size?: number;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "P";
  return (
    <span
      className="personal-avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.3) }}
      role="img"
      aria-label={`Ảnh đại diện ${name}`}
    >
      {initials}
      <i />
    </span>
  );
}
