export type Severity = "low" | "medium" | "high";

export interface Hazard {
  id: string;
  title: string;
  description: string;
  industry: string;
  categories: string[];
  severity: Severity;
  keywords: string[];
}
