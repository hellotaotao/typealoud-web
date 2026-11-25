import { describe, expect, it } from 'vitest'
import { releases, milestones, getMilestones, getReleaseTranslation, releaseAnchor, releaseHeadlines, releaseHref, type Release } from './data'

describe('release evidence and milestone history', () => {
  it('has ordered, unique published versions with explicit gaps', () => {
    expect(releases.length).toBeGreaterThanOrEqual(47)
    expect(new Set(releases.map(record => record.version)).size).toBe(releases.length)
    for (const record of releases) {
      expect(['available', 'missing']).toContain(record.notesStatus)
      if (record.notesStatus === 'available') expect(record.body.trim()).not.toBe('')
    }
    for (let index = 1; index < releases.length; index++) {
      expect(Date.parse(releases[index - 1].publishedAt)).toBeGreaterThanOrEqual(Date.parse(releases[index].publishedAt))
    }
  })
  it('links every milestone claim to a published version and orders refinements after introduction', () => {
    expect(milestones.length).toBeGreaterThanOrEqual(5)
    expect(new Set(milestones.map(item => item.id)).size).toBe(milestones.length)
    for (const milestone of milestones) {
      const first = releases.find(record => record.version === milestone.introducedVersion)
      expect(first?.notesStatus).toBe('available')
      for (const step of milestone.evolution) {
        const record = releases.find(record => record.version === step.version)
        expect(record?.notesStatus).toBe('available')
        expect(Date.parse(record!.publishedAt)).toBeGreaterThan(Date.parse(first!.publishedAt))
      }
    }
  })
  it('does not misdate local transcription or failed-recording recovery to a later refinement', () => {
    expect(milestones.find(item => item.id === 'local-transcription')?.introducedVersion).toBe('v1.4.0')
    expect(milestones.find(item => item.id === 'recording-recovery')?.introducedVersion).toBe('v1.8.0')
  })
  it('keeps milestone facts current and includes major v1.19-v1.22 capabilities', () => {
    for (const locale of ['en', 'zh'] as const) {
      const items = getMilestones(locale)
      const handsFree = items.find(item => item.id === 'hands-free-dictation')!
      expect(handsFree.summary).not.toContain('Ctrl+Shift')
      const recovery = items.find(item => item.id === 'recording-recovery')!
      expect(recovery.scope).toContain('200')
      expect(recovery.scope).not.toContain('100')
      for (const [id, version] of [
        ['openrouter-cloud', 'v1.22.0'],
        ['single-key-shortcuts', 'v1.21.0'],
        ['open-source-and-platform', 'v1.20.0'],
        ['dictionary-corrections', 'v1.19.1'],
      ]) {
        expect(items.find(item => item.id === id)?.introducedVersion).toBe(version)
      }
    }
  })
  it('uses deterministic anchors including legacy versions', () => {
    expect(releaseAnchor('v1.15.8')).toBe('release-v1-15-8')
    expect(releaseHref('1.0.67')).toBe('/changelog#release-1-0-67')
  })
})

describe('localized release data', () => {
  it('provides complete Chinese milestones without changing version evidence', () => {
    const translated = getMilestones('zh')
    expect(getMilestones('en')).toEqual(milestones)
    expect(translated).toHaveLength(milestones.length)
    for (const original of milestones) {
      const item = translated.find(record => record.id === original.id)!
      expect(item.introducedVersion).toBe(original.introducedVersion)
      expect(item.details).toHaveLength(original.details.length)
      expect(item.evolution.map(step => step.version)).toEqual(original.evolution.map(step => step.version))
      for (const text of [item.title, item.summary, item.category, item.scope, ...item.details, ...item.evolution.map(step => step.description)]) expect(text).toMatch(/[\u4e00-\u9fff]/)
    }
  })
  it('localizes release anchors and translates only documented legacy notes', () => {
    expect(releaseHref('v1.15.8', 'zh')).toBe('/zh/changelog#release-v1-15-8')
    expect(getReleaseTranslation('1.0.66')).toContain('Whisper-1')
    expect(getReleaseTranslation('1.0.67')).toContain('gpt-4o-mini-transcribe')
    expect(getReleaseTranslation('v999.0.0')).toBeUndefined()
  })
  it('takes release headlines from bold leads in the reader\'s language and skips platform labels', () => {
    const release: Release = { version: 'v9.0.0', publishedAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', url: '', notesStatus: 'available', body: '## What\'s new\n- **Faster setup.** Details.\n- **Windows**: a fix.\n- Plain bullet.\n## 中文\n- **更快的设置。** 细节。\n## Download / 下载\n- **macOS dmg**' }
    expect(releaseHeadlines(release)).toEqual(['Faster setup'])
    expect(releaseHeadlines(release, 'zh')).toEqual(['更快的设置'])
    expect(releaseHeadlines({ ...release, notesStatus: 'missing' })).toEqual([])
  })
})
