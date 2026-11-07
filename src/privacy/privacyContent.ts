import source from '../content/privacy.md?raw'
import type { Locale } from '../i18n'

export interface PrivacyDocument { title: string; intro: string; lines: string[] }

// src/content/privacy.md is a verbatim copy of PRIVACY.md from the app repository
// (scripts/sync-privacy.mjs). It holds the English text first, then the Chinese text
// after a horizontal rule and a "# 隐私说明" heading; each page shows one of them.
export function privacyDocument(locale: Locale, markdown: string = source): PrivacyDocument {
  const text = markdown.replace(/\r\n/g, '\n')
  const split = text.search(/^---[ \t]*\n+# 隐私说明/m)
  if (split < 0) throw new Error('privacy.md: the Chinese section is missing')
  const part = locale === 'zh' ? text.slice(split).replace(/^---[ \t]*\n+/, '') : text.slice(0, split)
  const lines = part.split('\n')
  const titleIndex = lines.findIndex((line) => /^#\s+/.test(line))
  if (titleIndex < 0) throw new Error(`privacy.md: no title in the ${locale} section`)
  let index = titleIndex + 1
  while (index < lines.length && !lines[index].trim()) index++
  const intro: string[] = []
  while (index < lines.length && lines[index].trim()) intro.push(lines[index++].trim())
  // Each language gets its own page, so the in-file jump to the other language goes.
  const body = lines.slice(index).filter((line) => !/^\[[^\]]+\]\(#[^)]+\)\s*$/.test(line.trim()))
  return { title: lines[titleIndex].replace(/^#\s+/, '').trim(), intro: intro.join(' '), lines: body }
}
