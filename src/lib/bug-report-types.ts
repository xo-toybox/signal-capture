export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ReportKind = 'bug' | 'feature';

export interface BugReportPayload {
  title: string;
  description: string;
  severity: Severity;
  kind: ReportKind;
  url: string;
  userAgent: string;
  viewport: string;
  consoleErrors: string[];
}

export interface BugReportSuccess {
  issue_url: string;
  issue_number: number;
}

export interface BugReportError {
  error: string;
}

export const SEVERITY_COLORS: Record<Severity, { text: string; bg: string; dot: string }> = {
  low: { text: '#22c55e', bg: 'rgba(34,197,94,0.08)', dot: '#22c55e' },
  medium: { text: '#eab308', bg: 'rgba(234,179,8,0.08)', dot: '#eab308' },
  high: { text: '#f97316', bg: 'rgba(249,115,22,0.08)', dot: '#f97316' },
  critical: { text: '#ef4444', bg: 'rgba(239,68,68,0.1)', dot: '#ef4444' },
};
