import { localizedPath, type Locale, type Page } from '../i18n'
import { parseRichText } from './linkMarkup'

export default function RichText({ value, locale }: { value: string; locale: Locale }) {
  return (
    <>
      {parseRichText(value).map((segment, index) => segment.target
        ? <a key={index} href={`${localizedPath(segment.target.page as Page, locale)}${segment.target.hash}`}>{segment.text}</a>
        : segment.text)}
    </>
  )
}
