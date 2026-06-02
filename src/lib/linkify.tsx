import { Fragment, type ReactNode } from "react";

// Matches http(s) and bare www URLs. Stops at whitespace and < characters.
const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

const stripTrailingPunct = (url: string) => {
  // Remove trailing punctuation that's unlikely to be part of the URL
  return url.replace(/[)\]}.,;:!?'"”’»]+$/u, "");
};

const normalizeHref = (raw: string) =>
  raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;

/**
 * Returns React nodes for a text string with URLs converted to anchor tags.
 * Caller is responsible for whitespace handling (whitespace-pre-wrap on parent).
 */
export function renderTextWithLinks(text: string | undefined | null): ReactNode {
  if (!text) return text || "";
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(URL_REGEX);
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    const rawUrl = stripTrailingPunct(match[0]);
    if (!rawUrl) continue;
    const start = match.index;
    const end = start + rawUrl.length;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));
    const href = normalizeHref(rawUrl);
    nodes.push(
      <a
        key={`lnk-${key++}-${start}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-emerald-400/60 text-emerald-300 hover:text-emerald-200 break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {rawUrl}
      </a>,
    );
    lastIndex = end;
    // If we stripped trailing punct, the regex index needs to advance past it
    if (end < match.index + match[0].length) {
      re.lastIndex = end;
    }
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  if (nodes.length === 0) return text;
  return <Fragment>{nodes}</Fragment>;
}
