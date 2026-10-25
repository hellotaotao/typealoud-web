import { describe, expect, it } from 'vitest'
import landingPages from '../content/landingPages.json'
import { landingPageIds } from '../i18n'
import { parseRichText, plainText } from './linkMarkup'

describe('landing link markup', () => {
  it('splits text around internal links and keeps anchors', () => {
    expect(parseRichText('See [the roundup](best-dictation-apps-mac) or [download](home#download).')).toEqual([
      { text: 'See ' },
      { text: 'the roundup', target: { page: 'best-dictation-apps-mac', hash: '' } },
      { text: ' or ' },
      { text: 'download', target: { page: 'home', hash: '#download' } },
      { text: '.' },
    ])
    expect(plainText('Try [MacWhisper](macwhisper-alternative).')).toBe('Try MacWhisper.')
  })

  it('leaves external and script URLs as plain text', () => {
    for (const value of ['[x](https://evil.example)', '[x](javascript:alert(1))']) {
      expect(parseRichText(value).every((segment) => !segment.target)).toBe(true)
    }
  })

  it('only links to pages that exist', () => {
    const valid = new Set<string>(['home', 'updates', 'changelog', ...landingPageIds])
    const copies = landingPages.pages.flatMap((page) => [page.en, page.zh])
    for (const copy of copies) {
      const texts = [...copy.sections.flatMap((section) => section.body), ...copy.faq.map((item) => item.a)]
      for (const text of texts) {
        expect(text).not.toMatch(/\]\((?![a-z0-9-]+(?:#[a-z0-9-]+)?\))/)
        for (const segment of parseRichText(text)) if (segment.target) expect(valid).toContain(segment.target.page)
      }
    }
    for (const page of landingPages.pages as { related?: string[] }[]) for (const id of page.related ?? []) expect(valid).toContain(id)
  })
})
