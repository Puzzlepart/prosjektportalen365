import {
  getContrastingShade,
  getContrastRatio,
  getReadableTextColor,
  getTint,
  parseColor
} from './contrast'

/** The timeline's grey rows, `rgba(0, 0, 0, 0.05)` over white. */
const GREY_ROW = '#f2f2f2'

/**
 * Contrast as WCAG 2.1 measures it, on the colours the timeline configuration ships with (the hub
 * template's `Tidslinjekonfigurasjon`), whose white text axe found too faint (2026-10-14).
 */
describe('contrast', () => {
  it('measures the contrast of two colours as WCAG does', () => {
    expect(getContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5)
    expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(getContrastRatio('#ffffff', '#f35d69')).toBeCloseTo(3.19, 2)
    expect(getContrastRatio('#fff', '#2589d6')).toBeCloseTo(3.73, 2)
    expect(getContrastRatio('rgb(255, 255, 255)', 'rgb(36, 158, 160)')).toBeCloseTo(3.24, 2)
    expect(getContrastRatio('#ffc800', '#ffffff')).toBeCloseTo(1.55, 2)
  })

  it('reads hex and rgb colours, blending a transparent one over white', () => {
    expect(parseColor('#F35D69')).toEqual([243, 93, 105])
    expect(parseColor('#abc')).toEqual([170, 187, 204])
    expect(parseColor('rgb(36, 158, 160)')).toEqual([36, 158, 160])
    expect(parseColor('rgba(51, 153, 51, 0.5)')).toEqual([153, 204, 153])
    expect(parseColor('rgb(51 153 51 / 50%)')).toEqual([153, 204, 153])
    expect(parseColor('#33993300')).toEqual([255, 255, 255])
  })

  it('reads nothing else', () => {
    for (const color of ['gold', 'transparent', '', 'linear-gradient(red, blue)', '#12345']) {
      expect(parseColor(color)).toBeUndefined()
    }
    expect(parseColor(undefined)).toBeUndefined()
    expect(getContrastRatio('gold', '#ffffff')).toBeUndefined()
  })

  it('keeps a readable text colour, and puts black or white in place of a faint one', () => {
    expect(getReadableTextColor('#1f4e79', '#ffffff')).toBe('#ffffff')
    expect(getReadableTextColor('#f35d69', '#ffffff')).toBe('#000000')
    expect(getReadableTextColor('#1f4e79', '#000000')).toBe('#ffffff')
    expect(getReadableTextColor('rgba(51, 153, 51, 0.3)', '#ffffff')).toBe('#000000')
    expect(getReadableTextColor('#f35d69')).toBe('#000000')
  })

  it('keeps the text colour on a background it cannot read', () => {
    expect(getReadableTextColor('gold', '#ffffff')).toBe('#ffffff')
    expect(getReadableTextColor('transparent')).toBeUndefined()
  })

  it('makes a light tone of a colour, a share of it over white', () => {
    expect(getTint('#f35d69')).toBe('#fabec3')
    expect(getTint('#2589d6')).toBe('#a8d0ef')
    expect(getTint('#000000', 0.5)).toBe('#808080')
    expect(getTint('rgba(0, 0, 0, 0.5)', 1)).toBe('#808080')
    expect(getTint('transparent')).toBeUndefined()
  })

  it('keeps a colour that stands out against a background, and darkens one that does not', () => {
    // The template's blue reaches 3:1 against the grey rows; its red, orange and yellow do not.
    expect(getContrastingShade('#2589d6', GREY_ROW)).toBe('#2589d6')
    for (const color of ['#f35d69', '#ff9933', '#ffc800']) {
      const shade = getContrastingShade(color, GREY_ROW)
      expect(getContrastRatio(shade, GREY_ROW)).toBeGreaterThanOrEqual(3)
      // No darker than it takes.
      expect(getContrastRatio(shade, GREY_ROW)).toBeLessThan(3.1)
      expect(getContrastRatio(shade, '#000000')).toBeLessThan(getContrastRatio(color, '#000000'))
    }
    expect(
      getContrastRatio(getContrastingShade('#f35d69', '#ffffff', 4.5), '#ffffff')
    ).toBeGreaterThanOrEqual(4.5)
  })

  it('darkens a colour a quarter first when asked, so an edge shows round it', () => {
    expect(getContrastingShade('#6495ed', GREY_ROW, 3, 0.75)).toBe('#4b70b2')
    expect(getContrastingShade('#ffc800', GREY_ROW, 3, 0.75)).toBe('#ac8700')
  })

  it('makes no shade of a colour it cannot read', () => {
    expect(getContrastingShade('gold', GREY_ROW)).toBeUndefined()
    expect(getContrastingShade('#ffc800', 'transparent')).toBeUndefined()
  })
})
