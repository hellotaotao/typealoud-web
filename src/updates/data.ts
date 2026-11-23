import { localizedPath, type Locale } from '../i18n'
import chineseMilestones from '../content/milestones.zh.json'
import chineseReleases from '../content/release-translations.zh.json'
import releaseRecords from '../content/releases.json'
import milestoneRecords from '../content/milestones.json'

export interface Release {
  version: string
  publishedAt: string
  updatedAt: string
  url: string
  body: string
  notesStatus: 'available' | 'missing'
}

export interface Milestone {
  id: string
  title: string
  summary: string
  category: string
  introducedVersion: string
  details: string[]
  scope: string
  evolution: { version: string; description: string }[]
}

export const releases: Release[] = releaseRecords.map(record => ({
  ...record,
  notesStatus: record.notesStatus === 'available' ? 'available' : 'missing',
}))

export const milestones: Milestone[] = [...milestoneRecords].sort((a, b) => {
  const published = (version: string) => Date.parse(releases.find(record => record.version === version)!.publishedAt)
  return published(b.introducedVersion) - published(a.introducedVersion)
})

export function getMilestones(locale: Locale = 'en'): Milestone[] {
  if (locale === 'en') return milestones
  return milestones.map(original => chineseMilestones.find(record => record.id === original.id) ?? original)
}

export function getReleaseTranslation(version: string): string | undefined {
  return (chineseReleases as Record<string, string>)[version]
}

export function releaseAnchor(version: string): string {
  return `release-${version.replace(/\./g, '-')}`
}

export function releaseHref(version: string, locale: Locale = 'en'): string {
  return `${localizedPath('changelog', locale)}#${releaseAnchor(version)}`
}

function stripInline(text: string): string {
  return text.replace(/\*\*|__|`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim()
}

// Short, user-facing headlines for a release: the bold lead of each bullet in its notes.
// Releases written without bold leads (mostly fix-only patches) have none.
export function releaseHeadlines(release: Release, locale: Locale = 'en', limit = 3): string[] {
  if (release.notesStatus !== 'available') return []
  const english: string[] = []
  const chinese: string[] = []
  let target = english
  for (const raw of release.body.replace(/\r\n/g, '\n').split('\n')) {
    const heading = /^#{1,6}\s+(.+)$/.exec(raw.trim())
    if (heading) {
      const title = heading[1].trim()
      if (/^(?:downloads?|下载)(?:\s*\/\s*(?:downloads?|下载))?$/i.test(title)) break
      if (/^(?:中文|简体中文|更新内容|chinese)(?:\s*\([^)]*\))?$/i.test(title)) { target = chinese; continue }
      if (/^english$/i.test(title)) { target = english; continue }
    }
    target.push(raw)
  }
  const lines = locale === 'zh' && chinese.some(line => line.trim()) ? chinese : english
  return lines
    .map(line => /^\s*[-*+]\s+\*\*(.+?)\*\*/.exec(line)?.[1])
    .filter((item): item is string => !!item)
    .map(item => stripInline(item).replace(/[.。:：]$/, ''))
    .filter(item => !/^(?:windows|macos|mac|linux)$/i.test(item))
    .slice(0, limit)
}
