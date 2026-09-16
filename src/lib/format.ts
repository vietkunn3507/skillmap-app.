export const number = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(n);
export const industryName = (s: string) =>
  s === "it_data"
    ? "IT & Dữ liệu"
    : s === "ke_toan_tai_chinh"
      ? "Tài chính & Kế toán"
      : s;
export function salary(min: number | null, max: number | null) {
  if (min == null && max == null) return "Chưa công bố";
  const money = (n: number) => `${number(n / 1e6)} tr`;
  if (min != null && max != null)
    return `${money(min)} – ${money(max)} / tháng`;
  return min != null
    ? `Từ ${money(min)} / tháng`
    : `Đến ${money(max!)} / tháng`;
}
export const sameSkill = (a: string, b: string) =>
  a.trim().toLocaleLowerCase("vi") === b.trim().toLocaleLowerCase("vi");
export function splitMacro<T extends { year: number }>(rows: T[]) {
  return [
    rows.filter((r) => r.year < 2021),
    rows.filter((r) => r.year >= 2021),
  ];
}
