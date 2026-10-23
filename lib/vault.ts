/** Shapes shared by the API routes and the app. Safe to import on the client. */

export type CaptureType = "youtube" | "url" | "text" | "tweet" | "pdf";

export type CaptureSummary = {
  id: string;
  type: CaptureType;
  source_url: string | null;
  title: string;
  summary: string;
  one_line_takeaway: string;
  keywords: string[];
  created_at: string;
  summary_source: "ai" | "basic";
  connection_count: number;
};

export type Connection = { id: string; title: string; type: CaptureType; reason: string | null };

export type CaptureDetail = CaptureSummary & { entities: string[]; connections: Connection[] };

export type AskSource = { n: number; id: string; title: string; type: CaptureType; source_url: string | null };

export type AskRecord = {
  id: string;
  task: string;
  mode: string;
  response: string;
  sources: AskSource[];
  general_only: boolean;
  created_at: string;
};

export type ApiError = { code: string; message: string };

export const SOURCE_LABEL: Record<CaptureType, string> = {
  youtube: "YouTube",
  url: "Web page",
  text: "Note",
  tweet: "Post on X",
  pdf: "PDF",
};

export const EMPTY_VAULT_LINE =
  "Your Vault is empty on this topic yet — here’s my general knowledge answer. Save some sources about this and I’ll get smarter.";

/** Columns for list views: never the raw content or the vector. */
export const SUMMARY_COLUMNS =
  "id, type, source_url, title, summary, one_line_takeaway, keywords, created_at, summary_source, " +
  "outgoing:capture_links!capture_links_from_capture_id_fkey(count), incoming:capture_links!capture_links_to_capture_id_fkey(count)";

type Row = Omit<CaptureSummary, "connection_count"> & {
  outgoing?: { count: number }[];
  incoming?: { count: number }[];
};

export function toSummary(row: Row): CaptureSummary {
  const { outgoing, incoming, ...rest } = row;
  return { ...rest, connection_count: (outgoing?.[0]?.count ?? 0) + (incoming?.[0]?.count ?? 0) };
}
