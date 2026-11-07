import { type ReactNode } from 'react'

// Release notes are synced verbatim from GitHub and predate the rename, so the
// old product name is rewritten in prose only. Code spans and file names keep it.
const renamed = (text: string) => text.replace(/(?<![/\w])SayType(?![_\w])/g, 'TypeAloud')

export function inline(text: string): ReactNode[] {
  const tokens = /(`[^`]+`|\*\*[^*]+\*\*|(?<!!)\[[^\]]+\]\([^\s)]+\))/g
  const result: ReactNode[] = []
  let cursor = 0
  for (const match of text.matchAll(tokens)) {
    const start = match.index ?? 0
    result.push(renamed(text.slice(cursor, start)))
    const token = match[0]
    if (token.startsWith('`')) result.push(<code key={start}>{token.slice(1, -1)}</code>)
    else if (token.startsWith('**')) result.push(<strong key={start}>{renamed(token.slice(2, -2))}</strong>)
    else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      let safe = false
      try { safe = new URL(link?.[2] ?? '').protocol === 'https:' } catch { /* Render invalid URLs as text. */ }
      result.push(safe && link ? <a key={start} href={link[2]} rel="noreferrer">{link[1]}</a> : token)
    }
    cursor = start + token.length
  }
  result.push(renamed(text.slice(cursor)))
  return result
}
