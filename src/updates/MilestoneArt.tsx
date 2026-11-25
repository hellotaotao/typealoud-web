import type { CSSProperties, ReactNode } from 'react'
import './MilestoneArt.css'

const icon = (path: ReactNode) => <svg className="ma-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
const micIcon = icon(<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>)
const lockIcon = icon(<><rect x="5" y="11" width="14" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>)
const retryIcon = icon(<><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 4v5h-5" /></>)
const downloadIcon = icon(<><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></>)
const checkIcon = icon(<path d="m5 12.5 4.5 4.5L19 7.5" />)
const offlineIcon = icon(<><path d="M3 3l18 18" /><path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14.5 10.4A10 10 0 0 1 19 13M2 9.5a15 15 0 0 1 4.7-2.9M11 5.1A15 15 0 0 1 22 9.5" /></>)
const cloudIcon = icon(<path d="M17.5 19H7a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.3 9.2 4.5 4.5 0 0 1 17.5 19Z" />)
const codeIcon = icon(<><polyline points="8 7 3 12 8 17" /><polyline points="16 7 21 12 16 17" /><line x1="14" y1="5" x2="10" y2="19" /></>)

const bars = (count: number, className = 'ma-bar') => Array.from({ length: count }, (_, index) => <i key={index} className={className} style={{ '--n': index } as CSSProperties} />)

function Art({ id }: { id: string }) {
  switch (id) {
    case 'openrouter-cloud':
      return (
        <div className="ma-scene ma-cloud">
          <span className="ma-chip">{cloudIcon}</span>
          <span className="ma-arrow" />
          <span className="ma-cloud-models">
            <span className="ma-model-pill" style={{ '--n': 0 } as CSSProperties}>Qwen 1.7B</span>
            <span className="ma-model-pill ma-model-pill-accent" style={{ '--n': 1 } as CSSProperties}>MAI-2</span>
          </span>
        </div>
      )
    case 'single-key-shortcuts':
      return (
        <div className="ma-scene ma-single-key">
          <span className="ma-key ma-key-single"><b>⌘</b><i className="ma-ripple" /></span>
          <span className="ma-arrow" />
          <span className="ma-chip ma-speak-chip">{micIcon}<span className="ma-wave">{bars(5)}</span></span>
        </div>
      )
    case 'open-source-and-platform':
      return (
        <div className="ma-scene ma-platform">
          <span className="ma-glass">{micIcon}<span className="ma-wave">{bars(7)}</span></span>
          <span className="ma-chip ma-code-chip">{codeIcon}</span>
        </div>
      )
    case 'dictionary-corrections':
      return (
        <div className="ma-scene ma-dict">
          <s>Nematron</s>
          <span className="ma-arrow" />
          <span className="ma-dict-right">{checkIcon}<b>Nemotron</b></span>
        </div>
      )
    case 'hands-free-dictation':
      return (
        <div className="ma-scene ma-tap">
          <span className="ma-key"><b>×2</b><i className="ma-ripple" /><i className="ma-ripple ma-ripple-late" /></span>
          <span className="ma-arrow" />
          <span className="ma-chip ma-lock-chip">{lockIcon}<span className="ma-wave">{bars(5)}</span></span>
        </div>
      )
    case 'filler-removal':
      return (
        <div className="ma-scene ma-filler" lang="zh-CN">
          <span>觉得，</span><s>呃，</s><span>我们</span><i className="ma-caret" />
        </div>
      )
    case 'model-choice':
      return (
        <div className="ma-scene ma-sizes">
          <span className="ma-size ma-size-small"><b>0.6B</b></span>
          <span className="ma-switch"><i /></span>
          <span className="ma-size ma-size-large"><b>1.7B</b></span>
        </div>
      )
    case 'guided-setup':
      return (
        <div className="ma-scene ma-steps">
          {Array.from({ length: 5 }, (_, index) => <span key={index} className="ma-step" style={{ '--n': index } as CSSProperties}>{index === 4 ? micIcon : checkIcon}</span>)}
        </div>
      )
    case 'native-recording':
      return (
        <div className="ma-scene ma-capture">
          <span className="ma-chip ma-mic-chip">{micIcon}</span>
          <span className="ma-wave ma-wave-wide">{bars(14)}</span>
        </div>
      )
    case 'long-dictation':
      return (
        <div className="ma-scene ma-chunks">
          <span className="ma-track">{Array.from({ length: 4 }, (_, index) => <span key={index} className="ma-chunk" style={{ '--n': index } as CSSProperties}>{bars(6)}</span>)}</span>
          <span className="ma-lines">{Array.from({ length: 3 }, (_, index) => <i key={index} style={{ '--n': index } as CSSProperties} />)}</span>
        </div>
      )
    case 'recording-recovery':
      return (
        <div className="ma-scene ma-retry">
          <span className="ma-row"><span className="ma-chip ma-mic-chip">{micIcon}</span><span className="ma-lines">{Array.from({ length: 2 }, (_, index) => <i key={index} style={{ '--n': index } as CSSProperties} />)}</span><span className="ma-retry-button">{retryIcon}</span></span>
        </div>
      )
    case 'live-transcription':
      return (
        <div className="ma-scene ma-live">
          <span className="ma-words">{[3.2, 2.2, 4, 1.6, 2.8, 3.6, 2].map((width, index) => <i key={index} style={{ '--n': index, '--w': `${width}em` } as CSSProperties} />)}<b className="ma-caret" /></span>
          <span className="ma-wave">{bars(9)}</span>
        </div>
      )
    case 'automatic-updates':
      return (
        <div className="ma-scene ma-update">
          <span className="ma-chip ma-download">{downloadIcon}</span>
          <span className="ma-progress"><i /></span>
          <span className="ma-chip ma-done">{checkIcon}</span>
        </div>
      )
    case 'local-transcription':
      return (
        <div className="ma-scene ma-device">
          <span className="ma-laptop"><span className="ma-screen"><span className="ma-wave">{bars(7)}</span></span><span className="ma-base" /></span>
          <span className="ma-chip ma-offline">{offlineIcon}</span>
        </div>
      )
    default:
      return <div className="ma-scene ma-fallback"><span className="ma-chip">{micIcon}</span></div>
  }
}

export default function MilestoneArt({ id }: { id: string }) {
  return <div className="milestone-art" aria-hidden="true"><Art id={id} /></div>
}
