import { GlobeIcon, MicIcon, NoteIcon, PdfLogo, ReelIcon, XLogo, YouTubeLogo } from "@/components/icons";
import { SOURCE_LABEL, type CaptureType } from "@/lib/vault";
import styles from "./app.module.css";

/** The source's mark in a small tile, with its name for screen readers. */
export function SourceIcon({ type, size = 18 }: { type: CaptureType; size?: number }) {
  return (
    <span className={styles.sourceIcon} data-type={type} title={SOURCE_LABEL[type]}>
      {type === "youtube" ? (
        <YouTubeLogo size={size} />
      ) : type === "tweet" ? (
        <XLogo size={size - 3} />
      ) : type === "pdf" ? (
        <PdfLogo size={size + 2} />
      ) : type === "video" ? (
        <ReelIcon size={size} />
      ) : type === "audio" ? (
        <MicIcon size={size} />
      ) : type === "url" ? (
        <GlobeIcon size={size} />
      ) : (
        <NoteIcon size={size} />
      )}
      <span className="sr-only">{SOURCE_LABEL[type]}</span>
    </span>
  );
}

export function formatDate(iso: string) {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: sameYear ? undefined : "numeric" });
}
