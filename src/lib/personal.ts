import { api } from "./api";
import { demoMatches } from "./profile-data";
import type { Profile, MatchResponse } from "./types";
export function personalMatches(
  profile: Profile,
  signal: AbortSignal,
): Promise<MatchResponse> {
  if (profile.demo)
    return Promise.resolve({
      input_skills: profile.skills,
      matches: demoMatches,
    });
  return profile.skills.length
    ? api.match(profile.skills, signal)
    : Promise.resolve({ input_skills: [], matches: [] });
}
