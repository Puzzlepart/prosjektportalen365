import type { Moment } from 'moment'
import type { Unit } from 'react-calendar-timeline'
import { getUILocale } from '../../../util/getUILocale'

type LabelWidth = 'long' | 'mediumLong' | 'medium' | 'short'

/**
 * The calendar's own choice of format by the room a label has (`formatLabel` in
 * react-calendar-timeline's `DateHeader`).
 */
function getLabelWidth(labelWidth: number): LabelWidth {
  if (labelWidth >= 150) return 'long'
  if (labelWidth >= 100) return 'mediumLong'
  if (labelWidth >= 50) return 'medium'
  return 'short'
}

/**
 * The names in a label, as `Intl` options per unit and room: the calendar's default formats
 * (`defaultHeaderFormats`) with the month and day names, which moment writes in English unless its
 * global locale is changed. Units whose labels are numbers only keep moment's formats.
 */
const NAMED_FORMATS: Partial<
  Record<Unit, Partial<Record<LabelWidth, Intl.DateTimeFormatOptions>>>
> = {
  month: {
    long: { month: 'long', year: 'numeric' },
    mediumLong: { month: 'long' },
    medium: { month: 'long' },
    short: { month: '2-digit', year: '2-digit' }
  },
  day: {
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    mediumLong: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    medium: { weekday: 'short', day: 'numeric' },
    short: { day: 'numeric' }
  },
  hour: {
    long: {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    mediumLong: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  }
}

/** The calendar's default formats for the labels that hold no names. */
const NUMERIC_FORMATS: Partial<Record<Unit, Record<LabelWidth, string>>> = {
  year: { long: 'YYYY', mediumLong: 'YYYY', medium: 'YYYY', short: 'YY' },
  week: { long: 'w', mediumLong: 'w', medium: 'w', short: 'w' },
  isoWeek: { long: 'W', mediumLong: 'W', medium: 'W', short: 'W' },
  hour: { long: 'HH:00', mediumLong: 'HH:00', medium: 'HH:00', short: 'HH' },
  minute: { long: 'HH:mm', mediumLong: 'HH:mm', medium: 'HH:mm', short: 'mm' },
  second: { long: 'mm:ss', mediumLong: 'mm:ss', medium: 'mm:ss', short: 'ss' }
}

/**
 * A label of the timeline's date header in SharePoint's UI language: «juli», «juli 2026» and
 * «ons. 15.» on a Norwegian site, where react-calendar-timeline wrote «July», moment's global
 * language, which nothing sets (WCAG 3.1.2). Moment's global language is left as it is: setting
 * it would change every date moment writes on the page.
 *
 * @param interval The label's start and end
 * @param unit The header's unit
 * @param labelWidth The label's width in pixels
 * @param locale The language to write in, SharePoint's UI language by default
 */
export function formatHeaderLabel(
  [startTime]: [Moment, Moment],
  unit: Unit,
  labelWidth: number,
  locale: string = getUILocale()
): string {
  const width = getLabelWidth(labelWidth)
  const options = NAMED_FORMATS[unit]?.[width]
  if (options) return new Intl.DateTimeFormat(locale, options).format(startTime.toDate())
  return startTime.format(NUMERIC_FORMATS[unit]?.[width] ?? 'L')
}
