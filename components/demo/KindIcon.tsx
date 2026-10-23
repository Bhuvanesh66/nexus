import { ArticleIcon, NoteIcon, PostIcon, YouTubeIcon } from "@/components/icons";
import type { CaptureKind } from "./demo-data";

export function KindIcon({ kind, size = 16 }: { kind: CaptureKind; size?: number }) {
  switch (kind) {
    case "youtube":
      return <YouTubeIcon size={size} />;
    case "article":
      return <ArticleIcon size={size} />;
    case "note":
      return <NoteIcon size={size} />;
    case "tweet":
      return <PostIcon size={size} />;
  }
}
