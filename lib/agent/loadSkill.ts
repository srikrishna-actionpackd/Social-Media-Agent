import { readFileSync } from "fs";
import { join } from "path";

let cached: string | null = null;

export function loadAgentSkill(): string {
  if (cached) return cached;
  const path = join(process.cwd(), "skills", "agent_skill.md");
  cached = readFileSync(path, "utf-8");
  return cached;
}
