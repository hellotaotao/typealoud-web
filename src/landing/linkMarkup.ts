// Landing copy may link to other site pages with `[label](page-id)` or `[label](page-id#anchor)`.
// Only site page ids are accepted, so copy can never produce an external or script URL.
export type RichSegment = { text: string; target?: { page: string; hash: string } }

const linkPattern = /\[([^\]]+)\]\(([a-z0-9-]+)(#[a-z0-9-]+)?\)/g

export function parseRichText(value: string): RichSegment[] {
  const segments: RichSegment[] = []
  let last = 0
  for (const match of value.matchAll(linkPattern)) {
    if (match.index > last) segments.push({ text: value.slice(last, match.index) })
    segments.push({ text: match[1], target: { page: match[2], hash: match[3] ?? '' } })
    last = match.index + match[0].length
  }
  if (last < value.length) segments.push({ text: value.slice(last) })
  return segments
}

export function plainText(value: string): string {
  return value.replace(linkPattern, '$1')
}
