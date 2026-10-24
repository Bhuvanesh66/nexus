import { Fragment, type ReactNode } from "react";
import styles from "./app.module.css";

/**
 * A small Markdown renderer for the model's replies: headings, paragraphs, nested bullet and numbered lists,
 * bold, italic, inline code, links and the [#n] citations, which become chips pointing at the Sources list.
 * Builds React elements, never HTML strings.
 */

type ListItem = { indent: number; ordered: boolean; text: string };

function inline(text: string, cite: (n: number) => ReactNode, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\[#\d+\])|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[1]) out.push(<Fragment key={k}>{cite(Number(m[1].slice(2, -1)))}</Fragment>);
    else if (m[2]) out.push(<strong key={k}>{inline(m[2], cite, k)}</strong>);
    else if (m[3]) out.push(<em key={k}>{m[3]}</em>);
    else if (m[4]) out.push(<code key={k}>{m[4]}</code>);
    else if (m[5])
      out.push(
        <a key={k} href={m[6]} target="_blank" rel="noopener noreferrer">
          {m[5]}
        </a>,
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderList(items: ListItem[], cite: (n: number) => ReactNode, key: string): ReactNode {
  const base = items[0].indent;
  const Tag = items[0].ordered ? "ol" : "ul";
  const nodes: ReactNode[] = [];
  let i = 0;
  while (i < items.length) {
    const item = items[i];
    const children: ListItem[] = [];
    let j = i + 1;
    while (j < items.length && items[j].indent > base) children.push(items[j++]);
    nodes.push(
      <li key={`${key}-${i}`}>
        {inline(item.text, cite, `${key}-${i}`)}
        {children.length ? renderList(children, cite, `${key}-${i}-c`) : null}
      </li>,
    );
    i = j;
  }
  return <Tag className={styles.mdList}>{nodes}</Tag>;
}

export function Markdown({ text, cite }: { text: string; cite: (n: number) => ReactNode }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: ListItem[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      const k = `p${blocks.length}`;
      blocks.push(<p key={k}>{inline(paragraph.join(" "), cite, k)}</p>);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(<Fragment key={`l${blocks.length}`}>{renderList(list, cite, `l${blocks.length}`)}</Fragment>);
      list = [];
    }
  };

  for (const line of lines) {
    const heading = line.match(/^\s{0,3}(#{1,4})\s+(.*)$/);
    const item = line.match(/^(\s*)([-*•]|\d+[.)])\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const k = `h${blocks.length}`;
      const Tag = heading[1].length <= 2 ? "h3" : "h4";
      blocks.push(<Tag key={k}>{inline(heading[2].replace(/#+\s*$/, ""), cite, k)}</Tag>);
    } else if (item) {
      flushParagraph();
      list.push({ indent: item[1].replace(/\t/g, "    ").length, ordered: /\d/.test(item[2]), text: item[3] });
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else if (list.length && /^\s{2,}/.test(line)) {
      list[list.length - 1].text += ` ${line.trim()}`;
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();

  return <div className={styles.md}>{blocks}</div>;
}

/** The reply as plain text for the clipboard and for Gmail: no citation markers, no Markdown emphasis. */
export function plainText(text: string) {
  return text
    .replace(/\s?\[#\d+\]/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\s)\*([^*\s][^*]*)\*/g, "$1$2")
    .replace(/^#{1,4}\s+/gm, "")
    .trim();
}

/** Gmail compose with the drafted subject and body (the first "Subject:" line becomes the subject). */
export function gmailUrl(text: string) {
  const plain = plainText(text);
  const lines = plain.split("\n");
  const at = lines.findIndex((l) => /^\s*subject\s*:/i.test(l));
  const subject = at >= 0 ? lines[at].replace(/^\s*subject\s*:\s*/i, "").trim() : "";
  const body = (at >= 0 ? lines.slice(at + 1) : lines).join("\n").trim();
  const params = new URLSearchParams({ view: "cm", fs: "1", su: subject, body });
  return `https://mail.google.com/mail/?${params.toString().replace(/\+/g, "%20")}`;
}
