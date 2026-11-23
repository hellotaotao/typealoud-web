import { useEffect, useRef, type CSSProperties } from 'react'
import { getMilestones, getReleaseTranslation, releases, releaseAnchor, releaseHeadlines, releaseHref, type Milestone, type Release } from './data'
import { localizedPath, type Locale } from '../i18n'
import SiteHeader from '../SiteHeader'
import ReleaseNotes from './ReleaseNotes'
import GuideLinks from '../landing/GuideLinks'
import { setupPageMotion } from '../motion'
import MilestoneArt from './MilestoneArt'
import { milestoneTheme, themeLabel, themeOrder } from './themes'
import './UpdatesPage.css'

function dateLabel(value: string, locale: Locale) {
  const date = new Date(value)
  if (locale === 'zh') return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

function VersionLink({ version, locale }: { version: string; locale: Locale }) {
  return <a href={releaseHref(version, locale)}>v{version.replace(/^v/, '')}</a>
}

function ReleaseEntry({ release, latest, locale }: { release: Release; latest: boolean; locale: Locale }) {
  const headline = releaseHeadlines(release, locale, 1)[0]
  return (
    <details className="release-entry" id={releaseAnchor(release.version)} open={latest || undefined}>
      <summary>
        <span className="release-version">v{release.version.replace(/^v/, '')}{latest && <span className="latest-label">{locale === 'zh' ? '最新版本' : 'Latest'}</span>}</span>
        {headline && <span className="release-headline">{headline}</span>}
        <time dateTime={release.publishedAt}>{dateLabel(release.publishedAt, locale)}</time>
        <span className="release-expand" aria-hidden="true">+</span>
      </summary>
      <div className="release-body">
        {release.notesStatus === 'missing' ? <p className="missing-notes">{locale === 'zh' ? '此版本暂无发布说明。原始发布记录和安装包仍可在 GitHub 查看。' : 'Release notes are unavailable for this version. The original release and its downloads are still available on GitHub.'}</p> : <ReleaseNotes body={release.body} locale={locale} translation={getReleaseTranslation(release.version)} />}
        <a className="release-source" href={release.url}>{locale === 'zh' ? 'GitHub 原始发布记录' : 'Original release on GitHub'} <span aria-hidden="true">↗</span></a>
      </div>
    </details>
  )
}

function Changelog({ locale }: { locale: Locale }) {
  const years = [...new Set(releases.map((release) => release.publishedAt.slice(0, 4)))]
  return (
    <div className="updates-layout">
      <aside className="updates-aside">
        <p className="updates-eyebrow">{locale === 'zh' ? '浏览历史版本' : 'Browse the archive'}</p>
        <nav aria-label={locale === 'zh' ? '发布年份' : 'Release years'}>{years.map((year) => <a key={year} href={`#year-${year}`}>{year}<span>{releases.filter((release) => release.publishedAt.startsWith(year)).length}{locale === 'zh' ? ' 个版本' : ' releases'}</span></a>)}</nav>
        <p>{locale === 'zh' ? '每个正式版本及其原始发布说明。想了解产品的重要变化？' : 'Every published version, with its original release notes. Looking for the bigger picture? '}<a href={localizedPath('updates', locale)}>{locale === 'zh' ? '查看重要更新。' : 'Read the highlights.'}</a></p>
      </aside>
      <div className="release-archive">
        {years.map((year) => {
          const yearReleases = releases.filter((release) => release.publishedAt.startsWith(year))
          const minors = [...new Set(yearReleases.map((release) => release.version.replace(/^v/, '').split('.').slice(0, 2).join('.')))]
          return (
            <section className="release-year" key={year} id={`year-${year}`} aria-labelledby={`year-title-${year}`}>
              <h2 id={`year-title-${year}`}>{year}</h2>
              {Number(year) < 2026 && <p className="legacy-notice"><strong>{locale === 'zh' ? '历史版本。' : 'Historical releases.'}</strong>{locale === 'zh' ? '这些说明描述的是早期 TypeAloud，可能与当前应用不同。' : ' These notes describe earlier versions of TypeAloud and may not reflect the current app.'}</p>}
              {minors.map((minor) => (
                <section className="release-series" key={minor} aria-labelledby={`series-${year}-${minor}`}>
                  <h3 id={`series-${year}-${minor}`}>{minor}{locale === 'zh' ? ' 系列' : ' series'}</h3>
                  {yearReleases.filter((release) => release.version.replace(/^v/, '').split('.').slice(0, 2).join('.') === minor).map((release) => <ReleaseEntry key={release.version} release={release} latest={release === releases[0]} locale={locale} />)}
                </section>
              ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function shortVersion(version: string) {
  return `v${version.replace(/^v/, '')}`
}

function LatestRelease({ locale }: { locale: Locale }) {
  const latest = releases[0]
  if (!latest) return null
  const [lead, ...rest] = releaseHeadlines(latest, locale)
  return (
    <a className="latest-card" href={releaseHref(latest.version, locale)}>
      <span className="latest-kicker"><i aria-hidden="true" />{locale === 'zh' ? '最新版本' : 'Latest release'}</span>
      <span className="latest-version">{shortVersion(latest.version)}<time dateTime={latest.publishedAt}>{dateLabel(latest.publishedAt, locale)}</time></span>
      <strong>{lead ?? (locale === 'zh' ? '修复与改进' : 'Fixes and improvements')}</strong>
      {rest.length > 0 && <ul>{rest.map((item) => <li key={item}>{item}</li>)}</ul>}
      <span className="latest-cta">{locale === 'zh' ? '看看改了什么' : 'See what changed'} <span aria-hidden="true">→</span></span>
    </a>
  )
}

function RecentReleases({ locale }: { locale: Locale }) {
  const recent = releases.slice(1).map((release) => ({ release, headlines: releaseHeadlines(release, locale, 2) })).filter((item) => item.headlines.length > 0).slice(0, 3)
  if (recent.length === 0) return null
  return (
    <section className="recent-releases" aria-labelledby="recent-title">
      <div className="updates-section-head">
        <h2 id="recent-title" className="updates-eyebrow">{locale === 'zh' ? '最近几个版本' : 'Recent releases'}</h2>
        <a href={localizedPath('changelog', locale)}>{locale === 'zh' ? `全部 ${releases.length} 个版本` : `All ${releases.length} releases`} <span aria-hidden="true">→</span></a>
      </div>
      <ol className="recent-grid">
        {recent.map(({ release, headlines }, index) => (
          <li key={release.version} className="reveal-target" data-reveal-delay={index * 80}>
            <a className="recent-card" href={releaseHref(release.version, locale)}>
              <span className="recent-meta"><span className="recent-version">{shortVersion(release.version)}</span><time dateTime={release.publishedAt}>{dateLabel(release.publishedAt, locale)}</time></span>
              <ul>{headlines.map((item) => <li key={item}>{item}</li>)}</ul>
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}

function MilestoneTimeline({ milestones, locale }: { milestones: Milestone[]; locale: Locale }) {
  const versions = [...new Set([...milestones].reverse().map((milestone) => milestone.introducedVersion))]
  return (
    <div className="milestone-timeline">
      <ol aria-label={locale === 'zh' ? '按版本排列的里程碑' : 'Milestones by version'}>
        {versions.map((version) => (
          <li key={version}>
            <span className="timeline-dots">{milestones.filter((milestone) => milestone.introducedVersion === version).map((milestone) => <a key={milestone.id} href={`#${milestone.id}`} className={`timeline-dot theme-${milestoneTheme(milestone.id)}`} aria-label={milestone.category}><i aria-hidden="true" /></a>)}</span>
            <span className="timeline-version">{shortVersion(version)}</span>
            <span className="timeline-labels">{milestones.filter((milestone) => milestone.introducedVersion === version).map((milestone) => <a key={milestone.id} href={`#${milestone.id}`} tabIndex={-1}>{milestone.category}</a>)}</span>
          </li>
        ))}
      </ol>
      <ul className="timeline-legend" aria-label={locale === 'zh' ? '颜色图例' : 'Colour key'}>{themeOrder.map((theme) => <li key={theme} className={`theme-${theme}`}><i aria-hidden="true" />{themeLabel(theme, locale)}</li>)}</ul>
    </div>
  )
}

function Milestones({ locale }: { locale: Locale }) {
  const milestones = getMilestones(locale)
  return (
    <div className="milestones-page">
      <RecentReleases locale={locale} />
      <section className="milestone-section" aria-labelledby="milestones-title">
        <div className="milestone-intro">
          <p className="updates-eyebrow">{locale === 'zh' ? '产品的每一步进展' : 'The bigger picture'}</p>
          <h2 id="milestones-title">{locale === 'zh' ? 'TypeAloud 一路学会的事' : 'What TypeAloud learned to do'}</h2>
          <p>{locale === 'zh' ? '重要的新能力，以及它们从哪个版本开始提供。所有小改进和修复都记录在' : 'The capabilities that changed how TypeAloud works, and the release that brought each one. Small fixes and every patch live in the '}<a href={localizedPath('changelog', locale)}>{locale === 'zh' ? '完整更新日志中。' : 'complete changelog.'}</a></p>
        </div>
        <MilestoneTimeline milestones={milestones} locale={locale} />
        <div className="milestone-grid">
          {milestones.map((milestone, index) => {
            const introduced = releases.find((release) => release.version === milestone.introducedVersion)
            const theme = milestoneTheme(milestone.id)
            const extra = milestone.evolution.length
            return (
              <article className={`milestone milestone-card theme-${theme} reveal-target`} data-reveal-delay={(index % 2) * 90} id={milestone.id} key={milestone.id} aria-labelledby={`${milestone.id}-title`} style={{ '--card-index': index } as CSSProperties}>
                <MilestoneArt id={milestone.id} />
                <div className="milestone-body">
                  <div className="milestone-meta">
                    <span className="milestone-category"><i aria-hidden="true" />{milestone.category}</span>
                    <a className="milestone-version" href={releaseHref(milestone.introducedVersion, locale)}>{shortVersion(milestone.introducedVersion)}</a>
                    {introduced && <time dateTime={introduced.publishedAt}>{dateLabel(introduced.publishedAt, locale)}</time>}
                  </div>
                  <h2 id={`${milestone.id}-title`}>{milestone.title}</h2>
                  <p className="milestone-summary">{milestone.summary}</p>
                  <details className="milestone-more">
                    <summary>
                      <span>{locale === 'zh' ? '细节与适用范围' : 'Details and scope'}</span>
                      {extra > 0 && <span className="milestone-count">{locale === 'zh' ? `后续改进 ${extra} 次` : `${extra} later ${extra === 1 ? 'improvement' : 'improvements'}`}</span>}
                      <span className="milestone-toggle" aria-hidden="true" />
                    </summary>
                    <ul className="milestone-details">{milestone.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
                    <p className="milestone-scope">{milestone.scope}</p>
                    <div className="milestone-history">
                      <p><span className="history-label">{locale === 'zh' ? '首次推出' : 'First introduced'}</span><VersionLink version={milestone.introducedVersion} locale={locale} /></p>
                      {extra > 0 && <div className="milestone-evolution"><h3>{locale === 'zh' ? '后续改进' : 'Since then'}</h3><ol>{milestone.evolution.map((change) => <li key={`${change.version}-${change.description}`}><VersionLink version={change.version} locale={locale} /><span>{change.description}</span></li>)}</ol></div>}
                    </div>
                  </details>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default function UpdatesPage({ page, locale = 'en' }: { page: 'updates' | 'changelog'; locale?: Locale }) {
  const shell = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = shell.current
    if (!root) return
    const cleanupMotion = setupPageMotion(root)
    const cards = root.querySelectorAll('.milestone-card')
    if (typeof IntersectionObserver === 'undefined') {
      cards.forEach((card) => card.setAttribute('data-inview', ''))
      return cleanupMotion
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.setAttribute('data-inview', '')
        observer.unobserve(entry.target)
      }
    }, { threshold: 0.35 })
    cards.forEach((card) => observer.observe(card))
    return () => { observer.disconnect(); cleanupMotion() }
  }, [page])

  useEffect(() => {
    const revealRelease = () => {
      let id: string
      try { id = decodeURIComponent(window.location.hash.slice(1)) } catch { return }
      const target = document.getElementById(id)
      if (target instanceof HTMLDetailsElement) target.open = true
    }
    revealRelease()
    window.addEventListener('hashchange', revealRelease)
    return () => window.removeEventListener('hashchange', revealRelease)
  }, [])

  return (
    <div className={`updates-shell updates-shell-${page}`} lang={locale === 'zh' ? 'zh-CN' : 'en'} ref={shell}>
      <a className="updates-skip" href="#main">{locale === 'zh' ? '跳至正文' : 'Skip to content'}</a>
      <SiteHeader locale={locale} page={page} />
      <main id="main" tabIndex={-1}>
        <section className="updates-hero" aria-labelledby="updates-title">
          <div className="updates-hero-grid">
            <div className="updates-hero-copy">
              <p className="updates-eyebrow">{locale === 'zh' ? 'TypeAloud 的成长记录' : 'TypeAloud, over time'}</p>
              <h1 id="updates-title">{locale === 'zh' ? (page === 'updates' ? <>每次更新，<br /><span>让表达更轻松。</span></> : <>每个版本，<br /><span>每一处变化。</span></>) : (page === 'updates' ? <>A little closer to<br /><span>effortless.</span></> : <>Every release.<br /><span>Every detail.</span></>)}</h1>
              <p>{locale === 'zh' ? (page === 'updates' ? '从语音到文字，记录让表达更顺畅、让内容留在身边的重要变化。' : '按版本完整记录 TypeAloud 的新增功能、改进与修复。') : (page === 'updates' ? 'The meaningful changes to how you speak, write, and keep your words close.' : 'A complete record of what changed in TypeAloud, one version at a time.')}</p>
            </div>
            {page === 'updates' && <LatestRelease locale={locale} />}
          </div>
          <nav className="updates-tabs" aria-label={locale === 'zh' ? '更新栏目' : 'Updates navigation'}><a href={localizedPath('updates', locale)} aria-current={page === 'updates' ? 'page' : undefined}>{locale === 'zh' ? '重要更新' : 'Product highlights'}</a><a href={localizedPath('changelog', locale)} aria-current={page === 'changelog' ? 'page' : undefined}>{locale === 'zh' ? '完整日志' : 'Full changelog'} <span>{releases.length}</span></a></nav>
        </section>
        {page === 'updates' ? <Milestones locale={locale} /> : <Changelog locale={locale} />}
      </main>
      <GuideLinks locale={locale} />
      <footer className="updates-footer"><a href={localizedPath('home', locale)} className="updates-brand">TypeAloud</a><p>{locale === 'zh' ? '你的声音，留在你的设备上。' : 'Your voice. On your device.'}</p><a href={localizedPath('privacy', locale)}>{locale === 'zh' ? '隐私政策' : 'Privacy policy'}</a><a href={`${localizedPath('home', locale)}#download`}>{locale === 'zh' ? '下载 TypeAloud' : 'Get TypeAloud'} <span aria-hidden="true">↗</span></a></footer>
    </div>
  )
}
