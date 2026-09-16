import geo from "../data/vietnam-map.json";
import { skillKey, formatLocationLabel } from "./display";
import type { Job } from "./types";
export const locationRegistry = geo.locations.map((l) => ({
  ...l,
  key: skillKey(l.name),
  label: formatLocationLabel(l.name),
}));
const aliases: Record<string, string[]> = {
  "ha noi": ["ha noi", "hanoi"],
  "ho chi minh": ["ho chi minh", "tp.hcm", "tp hcm", "hcmc", "sai gon"],
  "da nang": ["da nang", "danang"],
  "thua thien hue": ["thua thien hue", "hue"],
  "ba ria vung tau": ["ba ria vung tau", "vung tau"],
};
export function matchesLocation(raw: string, key: string) {
  const value = " " + skillKey(raw) + " ";
  return (aliases[key] || [key]).some((term) =>
    value.includes(" " + term + " "),
  );
}
export function aggregateLocations(jobs: Job[]) {
  const unique = [...new Map(jobs.map((j) => [j.job_id, j])).values()];
  return locationRegistry
    .map((l) => ({
      ...l,
      count: unique.filter((j) => matchesLocation(j.location || "", l.key))
        .length,
    }))
    .filter((l) => l.count > 0);
}
export function rankValues(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
