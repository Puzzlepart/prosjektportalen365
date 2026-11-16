import { WarningFilled, WarningRegular } from '@fluentui/react-icons'
import { render } from '@testing-library/react'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import * as React from 'react'
import { StatusShape } from '../../util/statusMark'
import { StatusGlyph } from './StatusGlyph'

/** The shapes Fluent draws, as icons made for 12 px. */
const ICON_SHAPES: StatusShape[] = [
  'check',
  'warning',
  'cross',
  'checkCircle',
  'errorCircle',
  'prohibited',
  'triangle'
]

/** The shapes drawn in CSS, as borders in the text colour. */
const CSS_SHAPES: StatusShape[] = ['dot', 'square', 'diamond', 'ring', 'empty']

/** Every shape: a value's own icon and the «?» of a value the configuration does not know too. */
const ALL_SHAPES: StatusShape[] = [...ICON_SHAPES, ...CSS_SHAPES, 'icon', 'unknown']

/** What the keyboard can reach. */
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]'

/** A glyph of each shape, with a catalog icon as the value's own. */
const glyphs = (shapes: StatusShape[]) =>
  shapes.map((shape) => <StatusGlyph key={shape} shape={shape} iconName='Warning' />)

/** The glyph drawn for a shape. */
const glyphOf = (container: HTMLElement, shape: StatusShape) =>
  container.querySelector(`[data-status-glyph="${shape}"]`)

/** The path data an icon is drawn with. */
function pathsOf(element: Element): string[] {
  return Array.from(element.querySelectorAll('path'), (path) => path.getAttribute('d'))
}

/**
 * The shape a status value is drawn with in the status report column's tiles, so a status is not
 * told by its colour alone (WCAG 1.4.1). It is hidden from screen readers: the button the tiles
 * are in is named by the statuses.
 */
describe('StatusGlyph', () => {
  it('marks its root with the shape, hidden from screen readers', () => {
    const { container } = render(<div>{glyphs(ALL_SHAPES)}</div>)
    expect(container.querySelectorAll('[data-status-glyph]')).toHaveLength(ALL_SHAPES.length)
    for (const shape of ALL_SHAPES) {
      const glyph = glyphOf(container, shape)
      expect(glyph).toHaveAttribute('aria-hidden', 'true')
      expect(glyph).toHaveClass('statusGlyph')
    }
  })

  it('draws the check, the warning, the cross and their variants with icons made for 12 px', () => {
    const { container } = render(<div>{glyphs(ICON_SHAPES)}</div>)
    const paths = ICON_SHAPES.map((shape) => {
      const svg = glyphOf(container, shape).querySelector('svg')
      expect(svg).toHaveAttribute('width', '12')
      expect(svg).toHaveAttribute('height', '12')
      expect(svg).toHaveAttribute('fill', 'currentColor')
      return svg.querySelector('path').getAttribute('d')
    })
    // Each shape is an icon of its own.
    expect(new Set(paths).size).toBe(ICON_SHAPES.length)
  })

  it('draws the dot, the square, the diamond, the ring and the dash for no value in CSS', () => {
    const { container } = render(<div>{glyphs(CSS_SHAPES)}</div>)
    for (const shape of CSS_SHAPES) {
      const glyph = glyphOf(container, shape)
      expect(glyph.querySelector('svg')).toBeNull()
      expect(glyph.firstElementChild).toHaveClass(shape)
      expect(glyph.textContent).toBe('')
    }
  })

  it("draws the value's own icon at 12 px in the text colour, the catalog's filled one alone", () => {
    const { container } = render(<StatusGlyph shape='icon' iconName='Warning' />)
    const svgs = glyphOf(container, 'icon').querySelectorAll('svg')
    // A bundle would draw the regular icon beside the filled one, hidden by a class.
    expect(svgs).toHaveLength(1)
    expect(svgs[0]).toHaveStyle({ width: '12px', height: '12px' })
    expect(svgs[0]).toHaveAttribute('fill', 'currentColor')
    expect(svgs[0].style.color).toBe('')
    // `Warning` is a catalog name, so the icon is the catalog's `WarningFilled`.
    expect(pathsOf(svgs[0])).toEqual(pathsOf(render(<WarningFilled />).container))
    expect(pathsOf(svgs[0])).not.toEqual(pathsOf(render(<WarningRegular />).container))
  })

  it('draws a question mark for a value the configuration does not know', () => {
    const { container } = render(<StatusGlyph shape='unknown' />)
    const glyph = glyphOf(container, 'unknown')
    expect(glyph.textContent).toBe('?')
    expect(glyph.firstElementChild).toHaveClass('unknown')
    expect(glyph.querySelector('svg')).toBeNull()
  })

  it('takes a class from what holds it beside its own', () => {
    const { container } = render(<StatusGlyph shape='dot' className='tileGlyph' />)
    expect(glyphOf(container, 'dot')).toHaveClass('statusGlyph', 'tileGlyph')
  })

  it('holds nothing the keyboard can reach, and passes axe', async () => {
    const { container } = render(<div>{glyphs(ALL_SHAPES)}</div>)
    expect(container.querySelectorAll(FOCUSABLE)).toHaveLength(0)
    expect(await axeComponent(container)).toHaveNoViolations()
  })
})
