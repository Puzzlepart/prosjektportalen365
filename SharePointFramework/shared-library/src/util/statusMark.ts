import { getContrastingShade, parseColor, RgbColor } from './contrast'

/**
 * The faintest background a status mark is drawn on: a list row under the pointer, or the
 * timeline's grey rows.
 */
export const STATUS_MARK_BACKGROUND = '#f2f2f2'

/** The colour of a mark from a status value's own icon, when the value has no colour to give. */
const NEUTRAL_MARK_COLOR = '#616161'

/**
 * The icons that are no shape of their own: the hub template gives every status value `CircleFill`,
 * so its colour decides.
 */
const NO_OWN_ICON = ['', 'circle', 'circlefill']

/** The shape and colour of the mark beside a status icon. */
export interface IStatusMark {
  /** An icon in the catalog, or the status value's own icon. */
  iconName: string

  /** The status colour, darkened where it stands out less than 3:1 from the rows. */
  color: string
}

/**
 * The hue (0 to 360) and saturation (0 to 1) of a colour, as HSL has them.
 *
 * @param color The colour
 */
function getHueAndSaturation([red, green, blue]: RgbColor): [number, number] {
  const [r, g, b] = [red / 255, green / 255, blue / 255]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const chroma = max - min
  if (chroma === 0) return [0, 0]
  const lightness = (max + min) / 2
  const saturation = chroma / (1 - Math.abs(2 * lightness - 1))
  let hue: number
  if (max === r) hue = ((g - b) / chroma) % 6
  else if (max === g) hue = (b - r) / chroma + 2
  else hue = (r - g) / chroma + 4
  return [(hue * 60 + 360) % 360, saturation]
}

/**
 * The shape a status colour stands for: a check for green, a warning for yellow and orange, a
 * cross for red. Grey, blue and other colours say nothing of how a status is, so they have none.
 *
 * @param color The status colour
 */
function getShapeForColor(color: string): string | null {
  const parsed = parseColor(color)
  if (!parsed) return null
  const [hue, saturation] = getHueAndSaturation(parsed)
  if (saturation < 0.2) return null
  if (hue < 20 || hue >= 330) return 'DismissCircle'
  if (hue < 70) return 'Warning'
  if (hue < 170) return 'CheckmarkCircle'
  return null
}

/**
 * The mark beside a status icon, so the status is not told by colour alone (WCAG 1.4.1). Its
 * shape is the status value's own icon (`GtPortfolioColumnIconName` in
 * `Prosjektkolonnekonfigurasjon`) where it has one, otherwise the shape its colour stands for.
 * `null` when there is neither.
 *
 * @param color The status colour
 * @param iconName The status value's own icon
 */
export function getStatusMark(color?: string, iconName?: string): IStatusMark | null {
  const ownIcon = iconName?.trim() ?? ''
  const shape = NO_OWN_ICON.includes(ownIcon.toLowerCase()) ? getShapeForColor(color) : ownIcon
  if (!shape) return null
  return {
    iconName: shape,
    color: getContrastingShade(color, STATUS_MARK_BACKGROUND) ?? NEUTRAL_MARK_COLOR
  }
}
