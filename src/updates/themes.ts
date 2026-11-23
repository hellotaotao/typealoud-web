import type { Locale } from '../i18n'

export type MilestoneTheme = 'speak' | 'local' | 'reliable' | 'ease'

const themes: Record<string, MilestoneTheme> = {
  'hands-free-dictation': 'speak',
  'live-transcription': 'speak',
  'long-dictation': 'speak',
  'local-transcription': 'local',
  'model-choice': 'local',
  'native-recording': 'reliable',
  'recording-recovery': 'reliable',
  'automatic-updates': 'reliable',
  'guided-setup': 'ease',
  'filler-removal': 'ease',
}

export const themeOrder: MilestoneTheme[] = ['speak', 'local', 'reliable', 'ease']

export function milestoneTheme(id: string): MilestoneTheme {
  return themes[id] ?? 'local'
}

export function themeLabel(theme: MilestoneTheme, locale: Locale): string {
  const labels: Record<MilestoneTheme, [string, string]> = {
    speak: ['Dictation', '听写体验'],
    local: ['On your device', '本地与模型'],
    reliable: ['Reliability', '稳定可靠'],
    ease: ['Setup & cleanup', '上手与整理'],
  }
  return labels[theme][locale === 'zh' ? 1 : 0]
}
