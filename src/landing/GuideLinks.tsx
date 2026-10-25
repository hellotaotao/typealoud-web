import landingPages from '../content/landingPages.json'
import { localizedPath, type LandingPageId, type Locale, type Page } from '../i18n'
import './GuideLinks.css'

const groups = [
  { en: 'Compare', zh: '对比', match: (id: string) => id.endsWith('-alternative') },
  { en: 'Guides', zh: '指南', match: (id: string) => !id.endsWith('-alternative') },
]

export default function GuideLinks({ locale, current }: { locale: Locale; current?: Page }) {
  return (
    <nav className="guide-links" aria-label={locale === 'zh' ? '对比与指南' : 'Comparisons and guides'}>
      {groups.map((group) => (
        <div className="guide-links-group" key={group.en}>
          <p>{group[locale]}</p>
          <ul>
            {landingPages.pages.filter((page) => group.match(page.id)).map((page) => (
              <li key={page.id}>
                <a href={localizedPath(page.id as LandingPageId, locale)} aria-current={page.id === current ? 'page' : undefined}>{page[locale].nav}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
