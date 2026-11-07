import { type ReactNode } from 'react'
import { inline } from './inline'
import type { Locale } from '../i18n'

function markdown(lines: string[]): ReactNode[] {
  const blocks: ReactNode[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index].trim()
    if (!line || /^---+$/.test(line)) { index++; continue }
    if (line.startsWith('```')) {
      const code: string[] = []
      const start = index++
      while (index < lines.length && !lines[index].trim().startsWith('```')) code.push(lines[index++])
      index++
      blocks.push(<pre key={start}><code>{code.join('\n')}</code></pre>)
      continue
    }
    const heading = /^#{1,6}\s+(.+)$/.exec(line)
    if (heading) {
      blocks.push(<h4 key={index++}>{inline(heading[1])}</h4>)
      continue
    }
    const list = /^(?:[-*+]\s+|\d+\.\s+)/.exec(line)
    if (list) {
      const ordered = /^\d/.test(list[0])
      const items: ReactNode[] = []
      const start = index
      const pattern = ordered ? /^\d+\.\s+/ : /^[-*+]\s+/
      while (index < lines.length && pattern.test(lines[index].trim())) {
        items.push(<li key={index}>{inline(lines[index++].trim().replace(pattern, ''))}</li>)
      }
      blocks.push(ordered ? <ol key={start}>{items}</ol> : <ul key={start}>{items}</ul>)
      continue
    }
    const paragraph = [line]
    const start = index++
    while (index < lines.length && lines[index].trim() && !/^(?:#{1,6}\s|[-*+]\s|\d+\.\s|```)/.test(lines[index].trim())) paragraph.push(lines[index++].trim())
    blocks.push(<p key={start}>{inline(paragraph.join(' '))}</p>)
  }
  return blocks
}

export default function ReleaseNotes({ body, locale = 'en', translation }: { body: string; locale?: Locale; translation?: string }) {
  const english: string[] = []
  const chinese: string[] = []
  let isChinese = false
  let downloadDepth: number | null = null
  for (const line of body.replace(/\r\n/g, '\n').split('\n')) {
    const heading = /^(#{1,6})\s+(.+)$/.exec(line.trim())
    if (heading && /^(?:downloads?|下载)(?:\s*\/\s*(?:downloads?|下载))?\s*$/i.test(heading[2])) {
      downloadDepth = heading[1].length
      continue
    }
    if (downloadDepth !== null) {
      if (!heading || heading[1].length > downloadDepth) continue
      downloadDepth = null
    }
    if (heading && /^(?:中文|简体中文|更新内容|chinese)(?:\s*\([^)]*\))?$/i.test(heading[2])) {
      isChinese = true
      continue
    }
    if (heading && /^english$/i.test(heading[2])) { isChinese = false; continue }
    ;(isChinese ? chinese : english).push(line)
  }
  const hasChinese = chinese.some(line => line.trim())
  const hasEnglish = english.some(line => line.trim())
  if (locale === 'zh') {
    const translated = hasChinese ? chinese : translation?.split('\n')
    return (
      <div className="release-notes" lang="zh-CN">
        {!hasChinese && translation && <p className="translation-notice">网站翻译 · 英文原文见下方</p>}
        {!translated && <p className="translation-notice">此版本暂无中文说明，以下为英文原文。</p>}
        {translated ? markdown(translated) : <div lang="en">{markdown(english)}</div>}
        {translated && hasEnglish && <details className="translated-notes" lang="en"><summary lang="zh-CN">英文原文</summary>{markdown(english)}</details>}
      </div>
    )
  }
  return (
    <div className="release-notes" lang="en">
      {markdown(english)}
      {hasChinese && (
        <details className="translated-notes" lang="zh-CN">
          <summary>中文原文</summary>
          {markdown(chinese)}
        </details>
      )}
    </div>
  )
}
