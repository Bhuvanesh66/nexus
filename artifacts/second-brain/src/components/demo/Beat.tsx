import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { cssVars } from "@/lib/css";
import type { StageId } from "./demo-data";

type BeatProps = {
  /** Stage the element appears in. */
  at?: StageId;
  /** Delay inside that stage, in ms. */
  d?: number;
  /** Stage the element disappears in. Use a nested Beat when an element both appears and disappears. */
  out?: StageId;
  /** Delay inside the `out` stage, in ms. */
  o?: number;
  /** Keyframes to enter with (defaults to sb-rise). */
  a?: "sb-rise" | "sb-fade";
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "style" | "children">;

/** One timed element on the demo timeline (see demo.css for how data-at / data-out are read). */
export function Beat({ at, d, out, o, a, as: Tag = "span", className, style, children, ...rest }: BeatProps) {
  return (
    <Tag
      data-at={at}
      data-out={out}
      className={className}
      style={{ ...cssVars({ "--d": d || undefined, "--o": o || undefined, "--a": a }), ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
