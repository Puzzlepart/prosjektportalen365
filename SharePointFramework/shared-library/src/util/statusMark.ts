import { fabricIconAliases } from '../icons/fabricIconAliases'
import { getContrastingShade, getTint, parseColor, RgbColor } from './contrast'

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

/** The shape a status value is drawn with in the status report column. */
export type StatusShape =
  | 'check'
  | 'warning'
  | 'cross'
  | 'checkCircle'
  | 'errorCircle'
  | 'prohibited'
  | 'triangle'
  | 'dot'
  | 'square'
  | 'diamond'
  | 'ring'
  | 'icon'
  | 'unknown'
  | 'empty'

/** The shape a status value is drawn with, and its own icon where it has one. */
export interface IStatusShape {
  /** From `getStatusShapes`; `'unknown'` for a value not configured, `'empty'` for no value. */
  shape: StatusShape

  /** The value's own icon (GtPortfolioColumnIconName) when shape is 'icon'. */
  iconName?: string
}

/** A status value as `Prosjektkolonnekonfigurasjon` configures it for a status section. */
export interface IStatusValueConfig {
  /** The value's text (`GtPortfolioColumnValue`). */
  value: string

  /** The value's colour (`GtPortfolioColumnColor`). */
  color?: string

  /** The value's icon (`GtPortfolioColumnIconName`); the template's circle counts as none. */
  iconName?: string
}

/** A light fill and a dark ink of a status colour; the ink holds 4.5:1 against the fill. */
export interface IStatusTile {
  fill: string
  ink: string
}

/** Traffic-light class of a status colour, by its hue as getStatusMark reads it. */
export type StatusColorClass = 'red' | 'yellow' | 'green' | 'other'

/** The shapes a colour's hue gives, before the section's other colours are taken into account. */
type BaseShape = 'cross' | 'warning' | 'check' | 'dot' | 'ring'

/** Below this saturation a colour is a grey, as `getShapeForColor` reads it. */
const MIN_SATURATION = 0.2

/** How much of the status colour a tile's fill keeps, laid over white. */
const TILE_TINT = 0.25

/** The least contrast of a tile's ink against its fill: that of text (WCAG 1.4.3). */
const TILE_INK_CONTRAST = 4.5

/** The tiles worked out so far, by colour: a column draws the same few colours on every row. */
const statusTiles = new Map<string, IStatusTile | undefined>()

/** The shape each traffic-light class stands for; a saturated colour of another hue is a dot. */
const BASE_SHAPES: Record<StatusColorClass, BaseShape> = {
  red: 'cross',
  yellow: 'warning',
  green: 'check',
  other: 'dot'
}

/** The shapes a colour may take, in order, when an earlier colour in its section took its own. */
const SHAPE_VARIANTS: Record<BaseShape, StatusShape[]> = {
  cross: ['cross', 'prohibited'],
  warning: ['warning', 'errorCircle'],
  check: ['check', 'checkCircle'],
  dot: ['dot', 'square', 'diamond', 'triangle', 'ring'],
  ring: ['ring', 'square', 'diamond', 'triangle', 'dot']
}

/** The shapes that say nothing of how a status is, tried after a shape's own variants. */
const NEUTRAL_SHAPES: StatusShape[] = ['dot', 'square', 'diamond', 'triangle', 'ring']

/**
 * The shapes `StatusGlyph` draws with an icon, by the icon's name as `getIconKey` keys it (its
 * Fluent name without size and variant). An own icon of one of these names looks like the shape,
 * so it reserves the shape in its section.
 */
const LOOKALIKE_SHAPES = new Map<string, StatusShape>([
  ['checkmark', 'check'],
  ['warning', 'warning'],
  ['dismiss', 'cross'],
  ['checkmarkcircle', 'checkCircle'],
  ['errorcircle', 'errorCircle'],
  ['prohibited', 'prohibited'],
  ['triangle', 'triangle']
])

/** The variant at the end of an icon's name in lower case: `warningfilled` is a `warning`. */
const ICON_VARIANT = /(?:filled|regular|solid)$/

/**
 * The traffic-light class of a colour by its hue, within the bounds `getShapeForColor` uses: grey
 * and the hues that say nothing of a status (blue, purple) are `'other'`.
 */
function getHueClass(color: RgbColor): StatusColorClass {
  const [hue, saturation] = getHueAndSaturation(color)
  if (saturation < MIN_SATURATION) return 'other'
  if (hue < 20 || hue >= 330) return 'red'
  if (hue < 70) return 'yellow'
  if (hue < 170) return 'green'
  return 'other'
}

/** The shape a colour's hue gives: a cross, a warning or a check, a dot, or a ring for grey. */
function getBaseShape(color: RgbColor): BaseShape {
  const [, saturation] = getHueAndSaturation(color)
  return saturation < MIN_SATURATION ? 'ring' : BASE_SHAPES[getHueClass(color)]
}

/**
 * An icon's name as a key: the catalog name a UI Fabric name is drawn with (`fabricIconAliases`,
 * looked up as `resolveFluentIcon` does), in lower case and without its variant, so
 * `WarningFilled`, `warning`, `WarningSolid` and `Asterisk` are one icon.
 */
function getIconKey(iconName: string): string {
  const alias = Object.prototype.hasOwnProperty.call(fabricIconAliases, iconName)
    ? fabricIconAliases[iconName]
    : undefined
  const drawnName = typeof alias === 'object' ? alias.name : alias || iconName
  return drawnName.toLowerCase().replace(ICON_VARIANT, '')
}

/**
 * The values of a section that keep their own icon, and the shape each is drawn with. An icon is
 * kept for one colour only, that of the first value given with it: a value of another colour with
 * the same icon is drawn by its colour. The shape an own icon looks like (`LOOKALIKE_SHAPES`) is
 * added to `taken`, so no colour is drawn with it while another shape is free.
 *
 * @param values The section's values, in configuration order
 * @param taken The shapes no colour in the section may take
 */
function getOwnIconShapes(
  values: IStatusValueConfig[],
  taken: Set<StatusShape>
): Map<IStatusValueConfig, IStatusShape> {
  const ownIconShapes = new Map<IStatusValueConfig, IStatusShape>()
  const colorByIcon = new Map<string, string>()
  for (const config of values) {
    const ownIcon = config.iconName?.trim() ?? ''
    if (NO_OWN_ICON.includes(ownIcon.toLowerCase())) continue
    const iconKey = getIconKey(ownIcon)
    const colorKey = config.color?.trim().toLowerCase() ?? ''
    if (colorByIcon.has(iconKey) && colorByIcon.get(iconKey) !== colorKey) continue
    colorByIcon.set(iconKey, colorKey)
    ownIconShapes.set(config, { shape: 'icon', iconName: ownIcon })
    const lookalike = LOOKALIKE_SHAPES.get(iconKey)
    if (lookalike) taken.add(lookalike)
  }
  return ownIconShapes
}

/**
 * The shape a value without an own icon is drawn with, by its colour: the shape an equal colour
 * in the section took, else the first of its hue's shapes and then the neutral ones that is not
 * `taken`, else its hue's own. `'unknown'` for a colour that cannot be read. A new colour's shape
 * is recorded in `shapeByColor` and `taken`.
 */
function takeColorShape(
  color: string | undefined,
  shapeByColor: Map<string, StatusShape>,
  taken: Set<StatusShape>
): IStatusShape {
  const key = color?.trim().toLowerCase() ?? ''
  const parsed = parseColor(key)
  if (!parsed) return { shape: 'unknown' }
  if (!shapeByColor.has(key)) {
    const base = getBaseShape(parsed)
    const free = [...SHAPE_VARIANTS[base], ...NEUTRAL_SHAPES].find((shape) => !taken.has(shape))
    shapeByColor.set(key, free ?? base)
    taken.add(free ?? base)
  }
  return { shape: shapeByColor.get(key) }
}

/**
 * A light fill and a dark ink of a status colour, for the tile a status value is drawn on: the
 * fill a quarter of the colour over white, the ink the colour darkened just until it reads 4.5:1
 * against the fill (WCAG 1.4.3, 1.4.11), so the shape on the tile reads whatever colour the
 * customer configured. `undefined` for a colour that cannot be read (none, a colour name,
 * `transparent`). Worked out once per colour.
 */
export function getStatusTile(color?: string): IStatusTile | undefined {
  const key = color?.trim().toLowerCase() ?? ''
  if (!statusTiles.has(key)) {
    const fill = getTint(key, TILE_TINT)
    const ink = fill ? getContrastingShade(key, fill, TILE_INK_CONTRAST) : undefined
    statusTiles.set(key, fill && ink ? { fill, ink } : undefined)
  }
  return statusTiles.get(key)
}

/**
 * The traffic-light class of a status colour, by its hue as `getStatusMark` reads it: `'red'`,
 * `'yellow'` (orange too) or `'green'`, and `'other'` for blue, purple, grey and a colour that
 * cannot be read. What the status report column counts a report's statuses by.
 */
export function getStatusColorClass(color?: string): StatusColorClass {
  const parsed = parseColor(color)
  return parsed ? getHueClass(parsed) : 'other'
}

/**
 * The shape each value of a status section is drawn with, by value text, so the section's
 * statuses are told apart by more than their colour (WCAG 1.4.1). It holds to this:
 *
 * - Two colours it can read get different shapes while a shape is free. Values of one colour
 *   share a shape, unless one has an own icon.
 * - A value's own icon (`GtPortfolioColumnIconName`; the template's circle counts as none) is its
 *   shape, `'icon'` with the icon's name, for one colour only, that of the first value given with
 *   the icon. A value of another colour with the same icon is drawn by its colour instead. An
 *   icon is told by its name, in any case and with or without `Filled`, `Regular` or `Solid`.
 * - An own icon named as an icon the shapes are drawn with (`Checkmark`, `Warning`, `Dismiss`,
 *   `CheckmarkCircle`, `ErrorCircle`, `Prohibited`, `Triangle`), or with a UI Fabric name drawn
 *   as one of them (`Asterisk` as `Warning`), reserves that shape: no colour is drawn with it
 *   while another shape is free. Another icon that looks like a shape (a UI Fabric font icon such
 *   as `Cancel` or `Accept`) reserves nothing.
 * - A value drawn by its colour is `'unknown'` when the colour cannot be read.
 *
 * Own icons go first. The other values are then read in the order given, the configuration's.
 * A colour's hue gives its shape, as for `getStatusMark`: a check for green, a warning for yellow
 * and orange, a cross for red, a dot for a saturated colour of another hue (blue, purple) and a
 * ring for grey. A colour whose shape is taken, by an earlier colour or an own icon, gets the next
 * free variant (a check in a circle, an error circle, a prohibited sign), then the next free of
 * the dot, square, diamond, triangle and ring. Only when every one is taken does it share its
 * hue's shape. Empty values are left out.
 *
 * @param values The section's values, in configuration order
 */
export function getStatusShapes(values: IStatusValueConfig[]): Record<string, IStatusShape> {
  const nonEmpty = (values ?? []).filter(({ value }) => value?.trim())
  const taken = new Set<StatusShape>()
  const ownIconShapes = getOwnIconShapes(nonEmpty, taken)
  const shapeByColor = new Map<string, StatusShape>()
  const shapes: Record<string, IStatusShape> = {}
  for (const config of nonEmpty) {
    const ownIconShape = ownIconShapes.get(config)
    shapes[config.value] = ownIconShape ?? takeColorShape(config.color, shapeByColor, taken)
  }
  return shapes
}
