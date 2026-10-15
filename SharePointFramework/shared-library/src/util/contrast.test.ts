import { getContrastRatio, getReadableTextColor, parseColor } from './contrast'

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
})
