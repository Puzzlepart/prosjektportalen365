import { ISiteTimeZone, ISystemTime, pageContextInfo } from './pageContext'

const MINUTE = 60_000

/** The site's time zone, where the page context gave one. */
export function getSiteTimeZone(): ISiteTimeZone | undefined {
  return pageContextInfo().webTimeZoneData
}

/**
 * The UTC instant of a transition in `year`: the rule's weekday in its month, the `Day`th time
 * (the last when the month has fewer), at the rule's hour in the local time then in force.
 */
function transitionUtc(year: number, rule: ISystemTime, offsetMinutes: number): number {
  const firstWeekday = new Date(Date.UTC(year, rule.Month - 1, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, rule.Month, 0)).getUTCDate()
  let day = 1 + ((rule.DayOfWeek - firstWeekday + 7) % 7) + (rule.Day - 1) * 7
  while (day > daysInMonth) day -= 7
  const local = Date.UTC(year, rule.Month - 1, day, rule.Hour, rule.Minute ?? 0)
  return local - offsetMinutes * MINUTE
}

/**
 * The minutes to add to UTC for the site's wall time at `instant`, by SharePoint's own rules:
 * standard time is `-(Bias + StandardBias)`, daylight time `-(Bias + DaylightBias)` between the
 * daylight and standard transitions (around the new year south of the equator).
 *
 * @param instant The instant
 * @param zone The site's time zone
 */
export function siteOffsetMinutes(instant: Date, zone: ISiteTimeZone): number {
  const standard = -(zone.Bias + (zone.StandardBias ?? 0))
  const daylight = -(zone.Bias + zone.DaylightBias)
  const { DaylightDate: toDaylight, StandardDate: toStandard } = zone
  if (!toDaylight?.Month || !toStandard?.Month || !zone.DaylightBias) return standard
  const year = new Date(instant.getTime() + standard * MINUTE).getUTCFullYear()
  const start = transitionUtc(year, toDaylight, standard)
  const end = transitionUtc(year, toStandard, daylight)
  const t = instant.getTime()
  const inDaylight = start < end ? t >= start && t < end : t >= start || t < end
  return inDaylight ? daylight : standard
}

/**
 * The instant as the site's wall time, in a `Date` whose local fields hold that wall time, so
 * that `toLocaleString` without a time zone shows what SharePoint's own pages show. Without a
 * site time zone the instant comes back as it is, and the machine's time zone decides, as before.
 * The one hour a year the machine's own zone skips cannot be held in such a date; a value in it is
 * shown an hour off, which no date-only field reaches.
 *
 * @param instant The instant
 * @param zone The site's time zone, by default the page's (`getSiteTimeZone`)
 */
export function toSiteWallTime(
  instant: Date,
  zone: ISiteTimeZone | undefined = getSiteTimeZone()
): Date {
  if (!zone || isNaN(instant.getTime())) return instant
  const wall = new Date(instant.getTime() + siteOffsetMinutes(instant, zone) * MINUTE)
  return new Date(
    wall.getUTCFullYear(),
    wall.getUTCMonth(),
    wall.getUTCDate(),
    wall.getUTCHours(),
    wall.getUTCMinutes(),
    wall.getUTCSeconds(),
    wall.getUTCMilliseconds()
  )
}
