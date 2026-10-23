/**
 * Deterministic content for the landing-page demo. Nothing here talks to a backend: it is sample data
 * that walks through one story (a reel about accelerators becomes three sent applications) the same way on
 * every visit. The people, accelerators and notes are illustrative and only appear inside the demo UI.
 */

export const STAGE_IDS = ["capture", "understand", "connect", "ask", "recall", "create"] as const;
export type StageId = (typeof STAGE_IDS)[number];

export type AppTab = "dump" | "ask";

export interface Stage {
  id: StageId;
  label: string;
  /** One line on what happens in the stage, shown under the step bar. */
  description: string;
  /** How long the stage holds during a full play-through, in ms. */
  duration: number;
  tab: AppTab;
}

export const STAGES: readonly Stage[] = [
  {
    id: "capture",
    label: "Drop",
    description: "Paste a reel, link, voice note, screenshot, or anything you just learned.",
    duration: 2600,
    tab: "dump",
  },
  {
    id: "understand",
    label: "Absorb",
    description: "Nexus reads it, understands it, pulls out what matters.",
    duration: 3000,
    tab: "dump",
  },
  {
    id: "connect",
    label: "Connect",
    description: "Every new fragment gets stitched to related ones you’ve dropped before.",
    duration: 2800,
    tab: "dump",
  },
  {
    id: "ask",
    label: "Hand off",
    description: "Name a task: “apply to these accelerators”, “draft this email”, “prep me for Friday”.",
    duration: 2200,
    tab: "ask",
  },
  {
    id: "recall",
    label: "Surface",
    description: "Nexus pulls every fragment that matters, then offers what it can do for you.",
    duration: 3600,
    tab: "ask",
  },
  {
    id: "create",
    label: "Deliver",
    description: "It does the work, checks with you once, then finishes it. Done, not just answered.",
    duration: 7200,
    tab: "ask",
  },
];

export const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<StageId, Stage>;

export function stageIndex(id: StageId): number {
  return STAGE_IDS.indexOf(id);
}

/** Stages up to and including `id`, as the space-separated list the CSS reads from data-reached. */
export function reachedThrough(id: StageId): string {
  return STAGE_IDS.slice(0, stageIndex(id) + 1).join(" ");
}

/**
 * When each beat happens inside its stage, in ms from the start of the stage. The CSS reads these
 * through the --d custom property, scaled by --tempo.
 */
export const BEATS = {
  capture: { link: 250, send: 1000, slot: 1250, card: 1400 },
  understand: { title: 250, summary: [800, 1350], takeaway: 1900, keywords: 2350 },
  connect: { arc: 300, arcGap: 350, done: 1500, confirm: 1650, pill: 1850, pillGap: 150 },
  ask: { task: 350, mode: 650, press: 1500 },
  recall: { first: 200, gap: 250, checked: 1200, general: 1300, options: 1500, optionGap: 150, ready: 2100, pick: 2700 },
  create: {
    making: 200,
    made: 1400,
    preview: 1700,
    review: 2300,
    approve: 3800,
    sending: 4100,
    sent: 5200,
    done: 5900,
    compare: 6200,
    itemGap: 150,
    doneGap: 200,
  },
} as const;

export type CaptureId = "reel" | "metrics" | "pitch" | "team" | "partners" | "review";
export type CaptureKind = "reel" | "article" | "note" | "tweet";

export const KIND_LABEL: Record<CaptureKind, string> = {
  reel: "Instagram reel",
  article: "Article",
  note: "Typed note",
  tweet: "Tweet",
};

export interface Capture {
  id: CaptureId;
  kind: CaptureKind;
  title: string;
  /** Label used on source chips. */
  short: string;
  /** ISO date the fragment was dropped; the new one is dropped "today" during the demo. */
  savedOn: string | null;
}

/** The Vault, newest first. The first entry is the fragment the demo drops in. */
export const CAPTURES: readonly Capture[] = [
  { id: "reel", kind: "reel", title: "3 accelerators closing applications soon", short: "Accelerators reel", savedOn: null },
  { id: "metrics", kind: "note", title: "Our October numbers: 1,240 paying learners, +18% a month", short: "Your October numbers", savedOn: "2026-10-02" },
  { id: "pitch", kind: "note", title: "Our one-liner: cohort courses that get learners job-ready in 12 weeks", short: "Your one-liner", savedOn: "2026-09-18" },
  { id: "team", kind: "note", title: "Team: two founders, full-time since March, ex-product and ex-payments", short: "Your team note", savedOn: "2026-09-05" },
  { id: "partners", kind: "article", title: "What accelerator partners read first: traction, team, why now", short: "What partners read first", savedOn: "2026-08-21" },
  { id: "review", kind: "tweet", title: "A 15-minute weekly review: three questions every Friday", short: "Weekly review tweet", savedOn: "2026-08-02" },
];

export const NEW_CAPTURE_ID: CaptureId = "reel";

export const CAPTURE_BY_ID = Object.fromEntries(CAPTURES.map((c) => [c.id, c])) as Record<CaptureId, Capture>;

// A fixed locale and time zone keep the server and the browser on the same string.
const SAVED_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function savedLabel(capture: Capture): string {
  return capture.savedOn ? SAVED_FORMAT.format(new Date(`${capture.savedOn}T00:00:00Z`)) : "Today";
}

/** What the Absorb stage pulls out of the new reel. */
export const NEW_CAPTURE_INSIGHT = {
  link: "instagram.com/reel/C8kQ2xLp9wA",
  source: "Instagram reel · 0:58",
  title: "3 accelerators closing applications soon",
  summary: [
    "A founder walks through three accelerators taking applications:",
    "Northstar (closes Oct 31), Foundry 100 (Nov 4) and Sprint Labs (Nov 8), and what each form asks.",
  ],
  takeaway: "Lead with traction. Every form asks for it first.",
  keywords: ["accelerators", "deadlines", "applications"],
} as const;

/** Links the Connect stage draws from the new fragment. Not every fragment is connected. */
export const CONNECTIONS: readonly { to: CaptureId; reason: string }[] = [
  { to: "metrics", reason: "the traction every form asks for" },
  { to: "pitch", reason: "how applications open" },
  { to: "partners", reason: "same topic: getting into an accelerator" },
];

export type TaskId = "apply" | "email" | "meeting";

export interface AnswerPart {
  text: string;
  /** Fragments this sentence came from. */
  from?: readonly CaptureId[];
  /** Marks a sentence that comes from general AI knowledge rather than the user's Vault. */
  general?: boolean;
}

/** One piece of work Nexus produces in Deliver, with the label it ends on. */
export interface WorkItem {
  name: string;
  detail: string;
  done: string;
}

export interface Task {
  id: TaskId;
  chip: string;
  prompt: string;
  mode: string;
  /** Fragments the Surface stage lights up, in the order they appear in the Vault. */
  recalled: readonly CaptureId[];
  generalTopic: string;
  /** What Nexus offers to do once it has the fragments; the first is the one taken. */
  options: readonly [string, string, string];
  title: string;
  items: readonly [WorkItem, WorkItem, WorkItem];
  /** The status words for each piece of work and for the run as a whole. */
  verbs: { making: string; made: string; sending: string };
  lines: { making: string; review: string; sending: string; done: string };
  /** One piece of the work, shown for review, with the fragment behind each sentence. */
  preview: { label: string; parts: readonly AnswerPart[] };
  /** The same request answered by generic AI, which stops at the answer. */
  generic: { parts: readonly AnswerPart[]; foot: string };
  narration: { recall: string; create: string };
}

export const TASKS: readonly Task[] = [
  {
    id: "apply",
    chip: "Apply to accelerators",
    prompt: "I need to apply to startup accelerators.",
    mode: "Take action",
    recalled: ["reel", "metrics", "pitch", "team"],
    generalTopic: "Accelerator applications",
    options: [
      "Apply to all 3 accelerators from the reel",
      "Draft one application for you to review",
      "Add the 3 deadlines to your calendar",
    ],
    title: "3 applications",
    items: [
      { name: "Northstar Accelerator", detail: "Closes Oct 31", done: "Sent" },
      { name: "Foundry 100", detail: "Closes Nov 4", done: "Sent" },
      { name: "Sprint Labs", detail: "Closes Nov 8", done: "Sent" },
    ],
    verbs: { making: "Creating", made: "Drafted", sending: "Sending" },
    lines: {
      making: "Creating applications…",
      review: "3 drafts ready. Need any refining?",
      sending: "Sending applications…",
      done: "Here. Done. 3 applications sent.",
    },
    preview: {
      label: "Northstar asks: What do you do, and what traction do you have?",
      parts: [
        { text: "Cohort courses that get learners job-ready in 12 weeks.", from: ["pitch"] },
        { text: "1,240 paying learners, growing 18% a month.", from: ["metrics"] },
        { text: "Two founders, full-time since March.", from: ["team"] },
        { text: "Kept within the form’s word limit.", general: true },
      ],
    },
    generic: {
      parts: [
        {
          text: "We are an innovative edtech startup leveraging AI to disrupt education and empower learners everywhere.", // taste-skill-ignore: generic AI's buzzwords are the point
        },
        { text: "Our passionate team is on a mission to transform how the world learns, and we are seeing strong early traction." },
      ],
      foot: "Generic AI stops at the answer. You paste it into each form and send it yourself.",
    },
    narration: {
      recall: "Surface: four fragments light up, and Nexus offers three things it can do. It takes the first: apply to all three.",
      create: "Deliver: three applications are drafted, you give the green light, and Nexus sends them.",
    },
  },
  {
    id: "email",
    chip: "Draft an email",
    prompt: "Ask my mentor Priya for a warm intro to Northstar.",
    mode: "Draft & send",
    recalled: ["reel", "metrics", "pitch"],
    generalTopic: "Warm intro requests",
    options: [
      "Write the intro request and send it to Priya",
      "Write it with a blurb she can forward",
      "Remind you to follow up in 3 days",
    ],
    title: "Intro email",
    items: [
      { name: "Email to Priya", detail: "Intro request", done: "Sent" },
      { name: "Blurb for Northstar", detail: "For her to forward", done: "Attached" },
      { name: "Follow-up", detail: "In 3 days", done: "Scheduled" },
    ],
    verbs: { making: "Writing", made: "Written", sending: "Sending" },
    lines: {
      making: "Writing the email…",
      review: "Draft ready. Need any refining?",
      sending: "Sending to Priya…",
      done: "Here. Done. Email sent to Priya.",
    },
    preview: {
      label: "To Priya · Intro to Northstar?",
      parts: [
        { text: "Hi Priya, Northstar’s applications close Oct 31.", from: ["reel"] },
        { text: "We’re at 1,240 paying learners, up 18% a month.", from: ["metrics"] },
        { text: "Cohort courses that get learners job-ready in 12 weeks; a blurb you can forward is attached.", from: ["pitch"] },
        { text: "Would you be open to introducing us?", general: true },
      ],
    },
    generic: {
      parts: [
        {
          text: "Hi Priya, I hope you’re doing well! I was wondering if you might be able to help me connect with some accelerators.",
        },
      ],
      foot: "Generic AI stops at the draft. You find the details, fix it and send it yourself.",
    },
    narration: {
      recall: "Surface: three fragments come back, the reel, your numbers and your one-liner, and Nexus offers to write and send the email.",
      create: "Deliver: the email and a forwardable blurb are written, you approve, and the email is sent.",
    },
  },
  {
    id: "meeting",
    chip: "Prep for a meeting",
    prompt: "Prep me for the Northstar interview on Friday.",
    mode: "Full Prep Brief",
    recalled: ["reel", "metrics", "team", "partners"],
    generalTopic: "Accelerator interviews",
    options: [
      "Write a one-page brief for the interview",
      "Draft answers to the questions they ask most",
      "Block 30 minutes on Thursday to rehearse",
    ],
    title: "Interview prep",
    items: [
      { name: "One-page brief", detail: "Context, approach, risks", done: "Saved" },
      { name: "Likely questions", detail: "6 answers", done: "Saved" },
      { name: "Rehearsal", detail: "Thu · 30 min", done: "Booked" },
    ],
    verbs: { making: "Preparing", made: "Ready", sending: "Saving" },
    lines: {
      making: "Preparing your interview kit…",
      review: "Prep ready. Need any refining?",
      sending: "Saving your prep…",
      done: "Here. Done. Your Northstar prep is ready.",
    },
    preview: {
      label: "Brief · Opening line",
      parts: [
        { text: "“We grew 18% last month. Here’s what drove it.”", from: ["metrics"] },
        { text: "Partners read traction, team and why now first, so lead with those.", from: ["partners"] },
        { text: "Two founders, full-time since March.", from: ["team"] },
        { text: "Have burn and runway ready.", general: true },
      ],
    },
    generic: {
      parts: [{ text: "Research the accelerator, practise your pitch and prepare questions to ask them." }],
      foot: "Generic AI stops at the advice. You write the brief and book the time yourself.",
    },
    narration: {
      recall: "Surface: a different set lights up for this task, including the article on what partners read first.",
      create: "Deliver: a brief, likely questions and a rehearsal slot are prepared, approved and saved.",
    },
  },
];

export const TASK_BY_ID = Object.fromEntries(TASKS.map((t) => [t.id, t])) as Record<TaskId, Task>;

export const DEFAULT_TASK_ID: TaskId = "apply";

/** Spoken by the live region when a stage starts. */
export function narrationFor(stage: StageId, task: Task): string {
  switch (stage) {
    case "capture":
      return "Drop: an Instagram reel is dropped into Nexus.";
    case "understand":
      return "Absorb: Nexus reads the reel and pulls out the three accelerators, their deadlines and the key takeaway.";
    case "connect":
      return "Connect: the new fragment is stitched to three you dropped before.";
    case "ask":
      return `Hand off: ${task.prompt}`;
    case "recall":
      return task.narration.recall;
    case "create":
      return task.narration.create;
  }
}
