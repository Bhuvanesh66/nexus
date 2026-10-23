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
 * The Nexus mark: an N on an ink tile, drawn in three colours of the page's spectrum. The two uprights (teal,
 * violet) are what you know and what you are doing; the sky diagonal is where they meet. Same as app/icon.svg.
 */
export function NexusMark({ size = 20, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...rest}>
      <rect width="24" height="24" rx="6" fill="#111111" />
      <g fill="none" strokeWidth="3" strokeLinecap="round">
        <path d="M7.5 17V7" stroke="#2dd4bf" />
        <path d="M16.5 17V7" stroke="#a78bfa" /> {/* taste-skill-ignore: the logo's violet, from the brand's spectrum */}
        <path d="M7.5 7l9 10" stroke="#38bdf8" />
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

/** A short video: a frame with a clapper band across the top and a play mark. */
export function ReelIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.75" y="2.75" width="14.5" height="14.5" rx="4" />
      <path d="M2.75 7.25h14.5M7 2.75l2 4.5M11.5 2.75l2 4.5" />
      <path d="M8.6 10.1v4.4l3.8-2.2z" fill="currentColor" stroke="none" />
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

/*
 * Source logos for the hero's "what you can drop" panel. Instagram, YouTube Shorts and X are the brands' own
 * marks, path data from Simple Icons 16.33.0 (CC0), drawn in each brand's colour. The PDF mark is drawn here.
 */
type LogoProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

function Logo({ size = 28, color, d, ...rest }: LogoProps & { color: string; d: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...rest}>
      <path d={d} fill={color} />
    </svg>
  );
}

export function InstagramLogo(props: LogoProps) {
  return (
    <Logo
      {...props}
      color="#FF0069" // taste-skill-ignore: Instagram's brand colour
      d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"
    />
  );
}

export function YouTubeShortsLogo(props: LogoProps) {
  return (
    <Logo
      {...props}
      color="#FF0000" // taste-skill-ignore: YouTube's brand colour
      d="m18.931 9.99-1.441-.601 1.717-.913a4.48 4.48 0 0 0 1.874-6.078 4.506 4.506 0 0 0-6.09-1.874L4.792 5.929a4.504 4.504 0 0 0-2.402 4.193 4.521 4.521 0 0 0 2.666 3.904c.036.012 1.442.6 1.442.6l-1.706.901a4.51 4.51 0 0 0-2.369 3.967A4.528 4.528 0 0 0 6.93 24c.725 0 1.437-.174 2.08-.508l10.21-5.406a4.494 4.494 0 0 0 2.39-4.192 4.525 4.525 0 0 0-2.678-3.904ZM9.597 15.19V8.824l6.007 3.184z"
    />
  );
}

export function XLogo(props: LogoProps) {
  return (
    <Logo
      {...props}
      color="#000000"
      d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"
    />
  );
}

/** A PDF file: a red page with its corner folded and the letters PDF on it. */
export function PdfLogo({ size = 28, ...rest }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...rest}>
      <path
        d="M5.5 1h9.6L20.5 6.4V21.5A1.5 1.5 0 0 1 19 23H5.5A1.5 1.5 0 0 1 4 21.5V2.5A1.5 1.5 0 0 1 5.5 1z"
        fill="#E5322D" // taste-skill-ignore: the red every reader uses for PDF files
      />
      <path d="M15.1 1v3.9a1.5 1.5 0 0 0 1.5 1.5h3.9z" fill="#ffffff" fillOpacity={0.45} />
      {/* the letters P, D and F, drawn as strokes so they never depend on a font or join the page's text */}
      <path
        d="M6.8 18.5v-5h1.6a1.35 1.35 0 0 1 0 2.7H6.8M10.8 13.5v5h.9a2.5 2.5 0 0 0 0-5zM15.6 18.5v-5h2.6M15.6 16h2.2"
        fill="none"
        stroke="#ffffff"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
