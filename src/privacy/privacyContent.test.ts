import { describe, expect, it } from 'vitest'
import { privacyDocument } from './privacyContent'

describe('privacyDocument', () => {
  it('splits the synced PRIVACY.md into one document per language', () => {
    const en = privacyDocument('en')
    const zh = privacyDocument('zh')
    expect(en.title).toBe('Privacy')
    expect(zh.title).toBe('隐私说明')
    expect(en.intro).toContain('your voice stays on your computer')
    expect(en.lines.join('\n')).not.toContain('隐私说明')
    expect(zh.lines.join('\n')).not.toContain('What never leaves')
    expect(zh.lines.join('\n')).toContain('"event": "daily_usage"')
  })

  it('drops the in-file jump link to the other language', () => {
    const markdown = '# Privacy\n\nIntro.\n\n[中文版见下方](#隐私说明)\n\n## A\n\nText.\n\n---\n\n# 隐私说明\n\n简介。\n\n## 甲\n\n正文。\n'
    expect(privacyDocument('en', markdown).lines.join('\n')).not.toContain('中文版见下方')
    expect(privacyDocument('zh', markdown).intro).toBe('简介。')
  })

  it('fails loudly when the Chinese section is missing', () => {
    expect(() => privacyDocument('en', '# Privacy\n\nIntro.\n')).toThrow(/Chinese section/)
  })
})
