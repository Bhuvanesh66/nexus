import type { SVGProps } from "react";

/** Small outline icons drawn on a 20px grid. Decorative by default: pass aria-hidden={false} with a title to expose one. */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/**
 * The Nexus mark: an N on an ink tile, drawn in three colours of the spectrum. The two uprights (pink, sky) are
 * what you know and what you are doing; the amber diagonal is where they meet. Same shape as app/icon.svg.
 */
export function NexusMark({ size = 20, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...rest}>
      <rect width="24" height="24" rx="6" fill="#111111" />
      <g fill="none" strokeWidth="3" strokeLinecap="round">
        <path d="M7.5 17V7" stroke="#ff4f8b" />
        <path d="M16.5 17V7" stroke="#2e9bff" />
        <path d="M7.5 7l9 10" stroke="#ffc21a" />
      </g>
    </svg>
  );
}

/**
 * The Vault mark: two overlapping circles, what you have dropped and what AI knows. Marks anything that
 * came from the visitor's own fragments (source chips, the "fragments used" count).
 */
export function VaultMark({ size = 20, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...rest}>
      <circle cx="9" cy="12" r="7" fill="currentColor" />
      <circle cx="15" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function YouTubeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.75" y="4.75" width="14.5" height="10.5" rx="3" />
      <path d="M8.5 7.9v4.2l3.6-2.1z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ArticleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 2.75h6.5l3.5 3.5v11H5z" />
      <path d="M11.25 2.75v3.5h3.5M7.75 10h4.5M7.75 13h4.5" />
    </Icon>
  );
}

export function NoteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 3.75h12v8.5l-4 4H4z" />
      <path d="M12 16.25v-4h4M7 7.5h6M7 10.5h3" />
    </Icon>
  );
}

export function PostIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.75 4.25h12.5v9H9.5l-3.25 2.75v-2.75h-2.5z" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M2.75 10h14.5M10 2.75c2.4 2.1 2.4 12.4 0 14.5M10 2.75c-2.4 2.1-2.4 12.4 0 14.5" />
    </Icon>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.25 11.75l3.5-3.5" />
      <path d="M9.5 6.25l1.4-1.4a3 3 0 014.25 4.25l-1.4 1.4M10.5 13.75l-1.4 1.4a3 3 0 01-4.25-4.25l1.4-1.4" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.75 10.5l3.25 3.25 7.25-7.5" />
    </Icon>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 4.6v10.8l8.6-5.4z" fill="currentColor" />
    </Icon>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 4.75v10.5M13 4.75v10.5" strokeWidth={2.5} />
    </Icon>
  );
}

export function ReplayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.25 10a5.75 5.75 0 105.75-5.75H6.5" />
      <path d="M8.75 1.75L6.25 4.25l2.5 2.5" />
    </Icon>
  );
}

/** A plain arrow; its stroke keeps the same weight in px at any size. */
export function ArrowIcon({ size = 64, weight = 4, ...rest }: IconProps & { weight?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...rest}>
      <path
        d="M3 12h17M13 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth={weight}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="square"
      />
    </svg>
  );
}
