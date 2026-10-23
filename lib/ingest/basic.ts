/**
 * The fallback when no Claude provider is configured, or Claude fails twice: a plain extract of the content,
 * stored with summary_source = 'basic' and labelled "Basic summary" in the app. It is never presented as AI.
 */

const STOPWORDS = new Set(
  (
    "a about above after again against all also am an and any are as at be because been before being below between both but by can " +
    "could did do does doing down during each few for from further had has have having he her here hers him his how i if in into " +
    "is it its itself just me more most my no nor not now of off on once only or other our ours out over own same she should so " +
    "some such than that the their theirs them then there these they this those through to too under until up very was we were " +
    "what when where which while who whom why will with would you your yours really thing things like get got make made one two " +
    "use used using want need know think going every much many well even still may might must shall let lets via per " +
    "help please tomorrow today tonight yesterday prep prepare draft write give tell show find"
  ).split(" "),
);

function sentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function words(text: string, max: number) {
  const list = text.split(/\s+/).filter(Boolean);
  return list.length > max ? `${list.slice(0, max).join(" ")}…` : list.join(" ");
}

function top<T>(counts: Map<T, number>, n: number) {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}

export function basicSummary(content: string, titleHint: string | null) {
  let clean = content.replace(/\s+/g, " ").trim();
  // Links arrive as "Title (Site)" then the body; the takeaway should come from the body.
  const hint = titleHint?.trim();
  if (hint && clean.startsWith(hint)) clean = clean.slice(hint.length).replace(/^\s*(\([^)]*\))?\s*/, "") || clean;
  const all = sentences(clean);
  const first = all[0] ?? clean;

  let summary = "";
  for (const sentence of all) {
    if ((summary + " " + sentence).split(" ").length > 200) break;
    summary = summary ? `${summary} ${sentence}` : sentence;
  }
  if (!summary) summary = words(clean, 200);

  const keywordCounts = new Map<string, number>();
  for (const word of clean.toLowerCase().match(/\b[a-z][a-z0-9-]{3,}\b(?!['’])/g) ?? []) {
    if (!STOPWORDS.has(word)) keywordCounts.set(word, (keywordCounts.get(word) ?? 0) + 1);
  }

  const entityCounts = new Map<string, number>();
  for (const match of clean.matchAll(/(?<![.!?]\s)\b([A-Z][\w&'-]*(?:\s+[A-Z][\w&'-]*){0,3})/g)) {
    const entity = match[1].trim();
    if (entity.length > 1 && !STOPWORDS.has(entity.toLowerCase())) {
      entityCounts.set(entity, (entityCounts.get(entity) ?? 0) + 1);
    }
  }

  return {
    title: words(titleHint?.trim() || first.replace(/[.!?]$/, ""), 10),
    summary,
    one_line_takeaway: words(first, 20),
    keywords: top(keywordCounts, 8),
    entities: top(entityCounts, 8),
  };
}

/** Search terms for the keyword backup: proper nouns and quoted phrases first, then the longer words. */
export function searchTerms(text: string) {
  const terms = new Set<string>();
  for (const m of text.matchAll(/"([^"]{3,40})"|“([^”]{3,40})”/g)) terms.add((m[1] ?? m[2]).trim());
  for (const m of text.matchAll(/\b([A-Z][\w&-]+(?:\s+[A-Z][\w&-]+){0,2})/g)) {
    if (!STOPWORDS.has(m[1].toLowerCase())) terms.add(m[1]);
  }
  for (const word of text.toLowerCase().match(/[a-z][a-z0-9'-]{3,}/g) ?? []) {
    if (!STOPWORDS.has(word)) terms.add(word.replace(/'s$/, ""));
  }
  return [...terms].map((t) => t.replace(/[%_\\]/g, "")).filter((t) => t.length > 2).slice(0, 16);
}
