import { getContrastRatio } from './contrast'
import { getStatusMark, STATUS_MARK_BACKGROUND } from './statusMark'

/** The colours the hub template's `Prosjektkolonnekonfigurasjon` gives the status values. */
const GREEN = '#2da748'
const YELLOW = '#e9b359'
const RED = '#ea5c73'

/**
 * The shape beside a status icon, so a status is not told by its colour alone (WCAG 1.4.1): from
 * the status value's own icon where it has one, otherwise from its colour.
 */
describe('getStatusMark', () => {
  it("takes the shape from the colour's hue: a check for green, a warning for yellow, a cross for red", () => {
    expect(getStatusMark(GREEN)?.iconName).toBe('CheckmarkCircle')
    expect(getStatusMark(YELLOW)?.iconName).toBe('Warning')
    expect(getStatusMark(RED)?.iconName).toBe('DismissCircle')
    expect(getStatusMark('#ff8c00')?.iconName).toBe('Warning')
    expect(getStatusMark('rgb(16, 124, 16)')?.iconName).toBe('CheckmarkCircle')
  })

  it('gives no mark where the colour says nothing of the status: grey, blue, or none', () => {
    expect(getStatusMark('#444')).toBeNull()
    expect(getStatusMark('#c8c8c8')).toBeNull()
    expect(getStatusMark('#0078d4')).toBeNull()
    expect(getStatusMark(undefined)).toBeNull()
    expect(getStatusMark('')).toBeNull()
    expect(getStatusMark('green')).toBeNull()
  })

  it("uses the status value's own icon where it has one, whatever its colour", () => {
    expect(getStatusMark(GREEN, 'Warning')?.iconName).toBe('Warning')
    expect(getStatusMark('#444', 'Flag')?.iconName).toBe('Flag')
    expect(getStatusMark(undefined, 'Flag')?.iconName).toBe('Flag')
  })

  it("takes the template's circle for no icon of its own, so the colour decides", () => {
    expect(getStatusMark(RED, 'CircleFill')?.iconName).toBe('DismissCircle')
    expect(getStatusMark(RED, 'Circle')?.iconName).toBe('DismissCircle')
    expect(getStatusMark(RED, ' ')?.iconName).toBe('DismissCircle')
    expect(getStatusMark('#444', 'CircleFill')).toBeNull()
  })

  it('draws the mark in its colour, darkened just enough to stand out from the rows (WCAG 1.4.11)', () => {
    for (const color of [GREEN, YELLOW, RED]) {
      const mark = getStatusMark(color)
      expect(getContrastRatio(mark.color, STATUS_MARK_BACKGROUND)).toBeGreaterThanOrEqual(3)
    }
    // The template's yellow has 1.7:1 against the rows.
    expect(getStatusMark(YELLOW).color).not.toBe(YELLOW)
    expect(getStatusMark('#107c10').color).toBe('#107c10')
  })
})
