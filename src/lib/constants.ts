import type { EmploymentType, ExperienceLevel, WorkMode } from "@/lib/types";

/** How many jobs a visitor without Premium can see in full (never with an apply button). */
export const FREE_JOB_PREVIEW_COUNT = 3;

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior Level",
  lead: "Lead",
  executive: "Executive",
};

