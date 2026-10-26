import landingPages from '../content/landingPages.json'
import { localizedPath, type LandingPageId, type Locale } from '../i18n'
import SiteHeader from '../SiteHeader'
import DownloadButton from '../DownloadButton'
import GuideLinks from './GuideLinks'
import RichText from './RichText'
import '../updates/UpdatesPage.css'
import './LandingPage.css'

interface LandingCopy {
  eyebrow: string
  heading: string[]
  intro: string
  table?: { caption: string; columns: string[]; rows: string[][] }
  related?: LandingPageId[]
  sections: { heading: string; body: string[] }[]
  faq: { q: string; a: string }[]
}
type LandingKind = 'compare' | 'product' | 'review' | 'guide'
interface LandingEntry {
  id: string
  kind: LandingKind
  related?: LandingPageId[]
  checked?: string
  sources?: { label: string; url: string }[]
  en: LandingCopy & { nav: string }
  zh: LandingCopy & { nav: string }
}

function checkedLabel(value: string, locale: Locale) {
  const [year, month, day] = value.split('-').map(Number)
  if (locale === 'zh') return `${year}年${month}月${day}日`
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${day} ${months[month - 1]} ${year}`
}

export default function LandingPage({ page, locale = 'en' }: { page: LandingPageId; locale?: Locale }) {
  const entries = landingPages.pages as LandingEntry[]
  const entry = entries.find(({ id }) => id === page)!
  const copy = entry[locale]
  const zh = locale === 'zh'
  const home = localizedPath('home', locale)
  const hub = entries[0]
  const navName = (id: string) => entries.find((candidate) => candidate.id === id)![locale].nav
  // Reviews and guides are articles: they lead with the reader's question and say plainly who wrote them.
  const isArticle = entry.kind === 'review' || entry.kind === 'guide'
  const underHub = entry !== hub && (entry.kind === 'compare' || entry.kind === 'review')
  // Articles present TypeAloud as one option among others, so only product pages highlight it.
  const columnIndex = isArticle ? -1 : copy.table?.columns.indexOf('TypeAloud') ?? -1
  const aboutCompetitors = Boolean(copy.table) && (entry.kind === 'compare' || entry.kind === 'review')
  const sources = entry.checked && entry.sources && (
    <p className="landing-sources">
      {zh ? `${aboutCompetitors ? '竞品信息' : '内容'}核对于 ${checkedLabel(entry.checked, locale)}，来源：` : `${aboutCompetitors ? 'Competitor details' : 'Details'} checked on ${checkedLabel(entry.checked, locale)} against `}
      {entry.sources.map((source, index) => <span key={source.url}>{index > 0 && (zh ? '、' : ', ')}<a href={source.url} rel="nofollow noopener">{source.label}</a></span>)}
      {aboutCompetitors ? (zh ? '。价格和额度可能变动，请以官方页面为准。' : '. Prices and limits change; the official pages are authoritative.') : (zh ? '。' : '.')}
    </p>
  )

  return (
    <div className="updates-shell landing-shell" lang={zh ? 'zh-CN' : 'en'}>
      <a className="updates-skip" href="#main">{zh ? '跳至正文' : 'Skip to content'}</a>
      <SiteHeader locale={locale} page={page} />
      <main id="main" tabIndex={-1}>
        <section className="updates-hero landing-hero" aria-labelledby="landing-title">
          <nav className="landing-breadcrumbs" aria-label={zh ? '页面路径' : 'Breadcrumb'}>
            <ol>
              <li><a href={home}>TypeAloud</a></li>
              {underHub && <li><a href={localizedPath(hub.id as LandingPageId, locale)}>{hub[locale].nav}</a></li>}
              <li aria-current="page">{copy.nav}</li>
            </ol>
          </nav>
          <p className="updates-eyebrow">{copy.eyebrow}</p>
          <h1 id="landing-title">{copy.heading[0]}<br /><span>{copy.heading[1]}</span></h1>
          <p>{copy.intro}</p>
          {isArticle ? (
            <p className="landing-byline">{zh ? 'TypeAloud 团队' : 'By the TypeAloud team'}{entry.checked && <> · {zh ? '更新于 ' : 'Updated '}{checkedLabel(entry.checked, locale)}</>}</p>
          ) : (
            <div className="landing-actions">
              <DownloadButton locale={locale} />
              <a href={`${home}#workflow`}>{zh ? '看看 TypeAloud 怎么用' : 'See how TypeAloud works'}</a>
            </div>
          )}
        </section>
        <div className="landing-body">
          {copy.table && (
            <section className="landing-compare" aria-labelledby="landing-compare-title">
              <h2 id="landing-compare-title">{copy.table.caption}</h2>
              <div className="landing-table-scroll" tabIndex={0} role="group" aria-labelledby="landing-compare-title">
                <table>
                  <thead>
                    <tr>{copy.table.columns.map((column, index) => index === 0 ? <td key="corner" /> : <th key={column} scope="col" className={index === columnIndex ? 'is-ours' : undefined}>{column}</th>)}</tr>
                  </thead>
                  <tbody>
                    {copy.table.rows.map(([label, ...cells]) => (
                      <tr key={label} className={!isArticle && label === 'TypeAloud' ? 'is-ours' : undefined}><th scope="row">{label}</th>{cells.map((cell, index) => <td key={index} className={index + 1 === columnIndex ? 'is-ours' : undefined}>{cell}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sources}
            </section>
          )}
          {copy.sections.map((section) => (
            <section className="landing-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph) => <p key={paragraph}><RichText value={paragraph} locale={locale} /></p>)}
            </section>
          ))}
          {!copy.table && sources}
          {copy.related && (
            <section className="landing-related" aria-labelledby="landing-related-title">
              <h2 id="landing-related-title">{zh ? '逐个详细对比' : 'Detailed comparisons'}</h2>
              <ul>
                {copy.related.map((id) => <li key={id}><a href={localizedPath(id, locale)}>{navName(id)}</a></li>)}
              </ul>
            </section>
          )}
          <section className="landing-faq" aria-labelledby="landing-faq-title">
            <h2 id="landing-faq-title">{zh ? '常见问题' : 'Common questions'}</h2>
            <dl>
              {copy.faq.map(({ q, a }) => <div key={q}><dt>{q}</dt><dd><RichText value={a} locale={locale} /></dd></div>)}
            </dl>
          </section>
          {entry.related && (
            <section className="landing-related" aria-labelledby="landing-more-title">
              <h2 id="landing-more-title">{entry.kind === 'compare' || entry.kind === 'review' ? (zh ? '相关对比' : 'Related comparisons') : (zh ? '相关阅读' : 'Related reading')}</h2>
              <ul>
                {entry.related.map((id) => <li key={id}><a href={localizedPath(id, locale)}>{navName(id)}</a></li>)}
              </ul>
            </section>
          )}
          <section className="landing-cta" aria-labelledby="landing-cta-title">
            {isArticle && <p className="landing-cta-label">{zh ? '关于 TypeAloud' : 'About TypeAloud'}</p>}
            <h2 id="landing-cta-title">{zh ? 'TypeAloud：免费的 Mac 语音输入，在本机转写。' : 'TypeAloud: free dictation for Mac, transcribed on your Mac.'}</h2>
            <p>{isArticle ? (zh ? '这篇文章由 TypeAloud 团队撰写。TypeAloud 是我们做的开源应用：按住 Ctrl+Shift 说话，松开后文字出现在光标处，不限字数，无需账号。' : 'This page was written by the team behind TypeAloud, our open-source dictation app: hold Ctrl+Shift, speak, release, and the text appears at your cursor. No word limit, no account.') : (zh ? '按住 Ctrl+Shift 说话，松开后文字出现在光标处。不限字数，无需账号，开源。' : 'Hold Ctrl+Shift, speak, release, and the text appears at your cursor. No word limit, no account, open source.')}</p>
            <DownloadButton locale={locale} />
          </section>
        </div>
      </main>
      <GuideLinks locale={locale} current={page} />
      <footer className="updates-footer"><a href={home} className="updates-brand">TypeAloud</a><p>{zh ? '你的声音，留在你的设备上。' : 'Your voice. On your device.'}</p><a href={`${home}#download`}>{zh ? '下载 TypeAloud' : 'Get TypeAloud'} <span aria-hidden="true">↗</span></a></footer>
    </div>
  )
}
