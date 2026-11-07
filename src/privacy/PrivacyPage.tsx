import { type ReactNode } from 'react'
import { localizedPath, type Locale } from '../i18n'
import SiteHeader from '../SiteHeader'
import GuideLinks from '../landing/GuideLinks'
import { inline } from '../updates/inline'
import { privacyDocument } from './privacyContent'
import '../updates/UpdatesPage.css'
import '../landing/LandingPage.css'
import './PrivacyPage.css'

const sourceUrl = 'https://github.com/hellotaotao/typealoud/blob/main/PRIVACY.md'

const cells = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())

function blocks(lines: string[]): ReactNode[] {
  const result: ReactNode[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index].trim()
    if (!line || /^---+$/.test(line)) { index++; continue }
    if (line.startsWith('```')) {
      const code: string[] = []
      const start = index++
      while (index < lines.length && !lines[index].trim().startsWith('```')) code.push(lines[index++])
      index++
      result.push(<pre key={start}><code>{code.join('\n')}</code></pre>)
      continue
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line)
    if (heading) {
      result.push(heading[1] === '##' ? <h2 key={index++}>{inline(heading[2])}</h2> : <h3 key={index++}>{inline(heading[2])}</h3>)
      continue
    }
    if (line.startsWith('|')) {
      const rows: string[] = []
      const start = index
      while (index < lines.length && lines[index].trim().startsWith('|')) rows.push(lines[index++])
      const [head, , ...body] = rows
      result.push(
        <div className="landing-table-scroll" key={start} tabIndex={0}>
          <table>
            <thead><tr>{cells(head).map((cell) => <th key={cell} scope="col">{inline(cell)}</th>)}</tr></thead>
            <tbody>{body.map((row, rowIndex) => <tr key={rowIndex}>{cells(row).map((cell, cellIndex) => <td key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      )
      continue
    }
    if (/^[-*]\s+/.test(line)) {
      const items: ReactNode[] = []
      const start = index
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        const item = [lines[index++].trim().replace(/^[-*]\s+/, '')]
        while (index < lines.length && /^\s{2,}\S/.test(lines[index])) item.push(lines[index++].trim())
        items.push(<li key={index}>{inline(item.join(' '))}</li>)
      }
      result.push(<ul key={start}>{items}</ul>)
      continue
    }
    const paragraph = [line]
    const start = index++
    while (index < lines.length && lines[index].trim() && !/^(?:#{1,6}\s|[-*]\s|```|\|)/.test(lines[index].trim())) paragraph.push(lines[index++].trim())
    result.push(<p key={start}>{inline(paragraph.join(' '))}</p>)
  }
  return result
}

export default function PrivacyPage({ locale = 'en' }: { locale?: Locale }) {
  const zh = locale === 'zh'
  const home = localizedPath('home', locale)
  const privacy = privacyDocument(locale)
  return (
    <div className="updates-shell landing-shell" lang={zh ? 'zh-CN' : 'en'}>
      <a className="updates-skip" href="#main">{zh ? '跳至正文' : 'Skip to content'}</a>
      <SiteHeader locale={locale} page="privacy" />
      <main id="main" tabIndex={-1}>
        <section className="updates-hero landing-hero" aria-labelledby="privacy-title">
          <p className="updates-eyebrow">TypeAloud</p>
          <h1 id="privacy-title">{privacy.title}</h1>
          <p>{inline(privacy.intro)}</p>
          <p className="privacy-source">{zh ? '本页与源代码仓库中的 ' : 'This page is the '}<a href={sourceUrl}>PRIVACY.md</a>{zh ? ' 内容一致，随它一起更新。' : ' file from the source repository and is updated with it.'}</p>
        </section>
        <div className="landing-body privacy-body">{blocks(privacy.lines)}</div>
      </main>
      <GuideLinks locale={locale} />
      <footer className="updates-footer"><a href={home} className="updates-brand">TypeAloud</a><p>{zh ? '你的声音，留在你的设备上。' : 'Your voice. On your device.'}</p><a href={localizedPath('privacy', locale)} aria-current="page">{zh ? '隐私政策' : 'Privacy policy'}</a><a href={`${home}#download`}>{zh ? '下载 TypeAloud' : 'Get TypeAloud'} <span aria-hidden="true">↗</span></a></footer>
    </div>
  )
}
