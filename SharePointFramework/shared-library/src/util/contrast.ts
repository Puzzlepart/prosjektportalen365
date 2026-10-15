/**
 * Colour contrast as WCAG 2.1 defines it (1.4.3 for text, 1.4.11 for graphics), for colours that
 * come from configuration rather than from the theme, such as the timeline's.
 */

/** An sRGB colour, each channel from 0 to 255. */
export type RgbColor = [number, number, number]

const BLACK = '#000000'
const WHITE = '#ffffff'

/**
 * Reads a CSS colour given as hex (`#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa`) or as `rgb()` or
 * `rgba()`. A transparent colour is blended over white, the background of the timeline and the
 * page. Anything else (a colour name, `transparent`, a gradient) gives `undefined`.
 *
 * @param color The colour
 */
export function parseColor(color: string): RgbColor | undefined {
  const value = color?.trim().toLowerCase() ?? ''
  let channels: number[]
  let alpha = 1
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value)
  if (hex) {
    const digits =
      hex[1].length <= 4
        ? hex[1]
            .split('')
            .map((digit) => digit + digit)
            .join('')
        : hex[1]
    channels = [0, 2, 4].map((index) => parseInt(digits.slice(index, index + 2), 16))
    if (digits.length === 8) alpha = parseInt(digits.slice(6, 8), 16) / 255
  } else {
    const rgb =
      /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(value)
    if (!rgb) return undefined
    channels = [rgb[1], rgb[2], rgb[3]].map(Number)
    if (rgb[4] !== undefined) {
      alpha = rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : Number(rgb[4])
    }
  }
  if (channels.some((channel) => isNaN(channel)) || isNaN(alpha)) return undefined
  return channels.map((channel) => channel * alpha + 255 * (1 - alpha)) as RgbColor
}

/**
 * The relative luminance of a colour, as WCAG 2.1 defines it.
 *
 * @param color The colour
 */
function relativeLuminance(color: RgbColor): number {
  const [r, g, b] = color.map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * The contrast ratio of two colours, from 1 to 21, or `undefined` when either cannot be read
 * (see `parseColor`).
 *
 * @param first One colour
 * @param second The other colour
 */
export function getContrastRatio(first: string, second: string): number | undefined {
  const a = parseColor(first)
  const b = parseColor(second)
  if (!a || !b) return undefined
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * The colour to write text in on a background: the preferred colour when it reaches `minimum`
 * against the background, otherwise black or white, whichever contrasts more. A background that
 * cannot be read keeps the preferred colour.
 *
 * @param background The background colour
 * @param preferred The colour the text is configured to have
 * @param minimum The least contrast ratio, 4.5 for text of normal size (WCAG 1.4.3)
 */
export function getReadableTextColor(
  background: string,
  preferred?: string,
  minimum = 4.5
): string | undefined {
  const parsed = parseColor(background)
  if (!parsed) return preferred
  if (preferred && (getContrastRatio(preferred, background) ?? 0) >= minimum) return preferred
  const luminance = relativeLuminance(parsed)
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? BLACK : WHITE
}
