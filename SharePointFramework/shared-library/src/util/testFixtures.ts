import { ISiteTimeZone } from './pageContext'

/**
 * Site time zones as SharePoint's page context carries them (`webTimeZoneData`), for the tests:
 * the test hub's (id 4, Oslo's, as read from the hub on 2026-10-13), New York's, which changes on
 * the second Sunday of March and the first of November, Tokyo's without daylight time, Sydney's,
 * whose daylight time spans the new year, and Hawaii's, west of any machine the tests run on. A
 * Jest test cannot move the machine's zone (its `process.env` is a copy), so it moves the site's.
 */
export const OSLO_TIME_ZONE: ISiteTimeZone = {
  Id: 4,
  Description: '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris',
  Bias: -60,
  DaylightBias: -60,
  StandardBias: 0,
  DaylightDate: { Year: 0, Month: 3, DayOfWeek: 0, Day: 5, Hour: 2, Minute: 0 },
  StandardDate: { Year: 0, Month: 10, DayOfWeek: 0, Day: 5, Hour: 3, Minute: 0 }
}

export const NEW_YORK_TIME_ZONE: ISiteTimeZone = {
  Id: 10,
  Bias: 300,
  DaylightBias: -60,
  DaylightDate: { Year: 0, Month: 3, DayOfWeek: 0, Day: 2, Hour: 2, Minute: 0 },
  StandardDate: { Year: 0, Month: 11, DayOfWeek: 0, Day: 1, Hour: 2, Minute: 0 }
}

export const TOKYO_TIME_ZONE: ISiteTimeZone = {
  Id: 20,
  Bias: -540,
  DaylightBias: 0,
  DaylightDate: { Year: 0, Month: 0, DayOfWeek: 0, Day: 0, Hour: 0, Minute: 0 },
  StandardDate: { Year: 0, Month: 0, DayOfWeek: 0, Day: 0, Hour: 0, Minute: 0 }
}

export const SYDNEY_TIME_ZONE: ISiteTimeZone = {
  Id: 76,
  Bias: -600,
  DaylightBias: -60,
  DaylightDate: { Year: 0, Month: 10, DayOfWeek: 0, Day: 1, Hour: 2, Minute: 0 },
  StandardDate: { Year: 0, Month: 4, DayOfWeek: 0, Day: 1, Hour: 3, Minute: 0 }
}

/** Hawaii (id 15), without daylight time: west of any machine the tests run on. */
export const HONOLULU_TIME_ZONE: ISiteTimeZone = {
  Id: 15,
  Description: '(UTC-10:00) Hawaii',
  Bias: 600,
  DaylightBias: 0,
  StandardBias: 0
}
