import { getContrastRatio } from './contrast'
import {
  getStatusColorClass,
  getStatusMark,
  getStatusShapes,
  getStatusTile,
  IStatusValueConfig,
  STATUS_MARK_BACKGROUND
} from './statusMark'

/** The colours the hub template's `Prosjektkolonnekonfigurasjon` gives the status values. */
const GREEN = '#2da748'
const YELLOW = '#e9b359'
const RED = '#ea5c73'

/** SharePoint's blue and Fluent's grey: colours that say nothing of how a status is. */
const BLUE = '#0078d4'
const GREY = '#8a8886'

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
    expect(getStatusMark('grønn')).toBeNull()
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

/**
 * The tile a status value is drawn on in the status report column: a light tone of its colour,
 * and a dark one for the shape on it, which reads 4.5:1 against the tile (WCAG 1.4.3, 1.4.11).
 */
describe('getStatusTile', () => {
  it("makes a light fill and a dark ink of the template's colours, and of blue and grey", () => {
    expect(getStatusTile(GREEN)).toEqual({ fill: '#cbe9d1', ink: '#1f7332' })
    expect(getStatusTile(YELLOW)).toEqual({ fill: '#faecd6', ink: '#866733' })
    expect(getStatusTile(RED)).toEqual({ fill: '#fad6dc', ink: '#a54151' })
    expect(getStatusTile(BLUE)).toEqual({ fill: '#bfddf4', ink: '#0061ab' })
    expect(getStatusTile(GREY)).toEqual({ fill: '#e2e1e1', ink: '#656462' })
  })

  it('gives an ink that reads 4.5:1 against its fill, for the brightest colours too', () => {
    for (const color of [GREEN, YELLOW, RED, BLUE, GREY, '#ffff00', '#ff8c00']) {
      const { fill, ink } = getStatusTile(color)
      expect(getContrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('makes no tile of a colour it cannot read', () => {
    expect(getStatusTile(undefined)).toBeUndefined()
    expect(getStatusTile('')).toBeUndefined()
    expect(getStatusTile('transparent')).toBeUndefined()
    expect(getStatusTile('grønn')).toBeUndefined()
  })

  it('works a colour out once, however it is written', () => {
    expect(getStatusTile(' #2DA748 ')).toBe(getStatusTile(GREEN))
  })

  it('reads a colour name as the colour it names', () => {
    expect(getStatusTile('Green')).toEqual(getStatusTile('#008000'))
    expect(getStatusMark('red')).toEqual(getStatusMark('#ff0000'))
    expect(getStatusColorClass('green')).toBe('green')
  })
})

/** How the status report column counts a report's statuses: by colour, as the marks read it. */
describe('getStatusColorClass', () => {
  it("tells red, yellow and green by the colour's hue", () => {
    expect(getStatusColorClass(RED)).toBe('red')
    expect(getStatusColorClass(YELLOW)).toBe('yellow')
    expect(getStatusColorClass('#ff8c00')).toBe('yellow')
    expect(getStatusColorClass(GREEN)).toBe('green')
    expect(getStatusColorClass('rgb(16, 124, 16)')).toBe('green')
  })

  it('puts blue, purple, grey and a colour it cannot read in a class of their own', () => {
    for (const color of [BLUE, '#8764b8', GREY, '#444', 'grønn', '', undefined]) {
      expect(getStatusColorClass(color)).toBe('other')
    }
  })
})

/** A status value as `Prosjektkolonnekonfigurasjon` gives it, with the template's circle. */
function status(value: string, color?: string, iconName = 'CircleFill'): IStatusValueConfig {
  return { value, color, iconName }
}

/** The shape each value is drawn with, in the order the values are given. */
function shapesOf(values: IStatusValueConfig[]) {
  const shapes = getStatusShapes(values)
  return values.map(({ value }) => shapes[value]?.shape)
}

/**
 * The shape each value of a status section is drawn with in the status report column, so the
 * section's statuses are told apart by more than colour (WCAG 1.4.1): two colours in a section
 * share a shape only when every shape is taken.
 */
describe('getStatusShapes', () => {
  it("draws the template's values as the marks do: a check, a warning and a cross", () => {
    const risk = [status('Lav', GREEN), status('Medium', YELLOW), status('Høy', RED)]
    expect(shapesOf(risk)).toEqual(['check', 'warning', 'cross'])
  })

  it('gives a colour the next free variant of the shape an earlier colour took', () => {
    const time = [
      status('Foran plan', '#107c10'),
      status('På plan', GREEN),
      status('Mindre forsinkelser', YELLOW),
      status('Forsinket', RED)
    ]
    expect(shapesOf(time)).toEqual(['check', 'checkCircle', 'warning', 'cross'])
    const yellows = [status('Medium', YELLOW), status('Ukjent', '#ff8c00')]
    expect(shapesOf(yellows)).toEqual(['warning', 'errorCircle'])
    const reds = [status('Høy', RED), status('Kritisk', '#a4262c')]
    expect(shapesOf(reds)).toEqual(['cross', 'prohibited'])
  })

  it("goes on to the neutral shapes once a hue's variants are taken", () => {
    const greens = [
      status('Foran plan', '#107c10'),
      status('På plan', GREEN),
      status('Godt foran plan', '#7fba00')
    ]
    expect(shapesOf(greens)).toEqual(['check', 'checkCircle', 'dot'])
  })

  it('draws blue and purple as a dot and a square, and grey as a ring', () => {
    const others = [
      status('Ikke startet', BLUE),
      status('Pause', '#8764b8'),
      status('Vet ikke', GREY),
      status('Utgått', '#c8c8c8')
    ]
    expect(shapesOf(others)).toEqual(['dot', 'square', 'ring', 'diamond'])
  })

  it('gives values of one colour one shape, as the template does for its budget', () => {
    const budget = [
      status('Under budsjett', GREEN),
      status('På budsjett', GREEN),
      status('Mindre overskridelser', YELLOW),
      status('Vet ikke', ' #E9B359 '),
      status('Over budsjett', RED)
    ]
    expect(shapesOf(budget)).toEqual(['check', 'check', 'warning', 'warning', 'cross'])
  })

  it("draws a value's own icon, and one like no shape takes none from the other values", () => {
    const shapes = getStatusShapes([
      status('Foran plan', '#107c10', ' Flag '),
      status('På plan', GREEN),
      status('Forsinket', RED, 'Circle')
    ])
    expect(shapes['Foran plan']).toEqual({ shape: 'icon', iconName: 'Flag' })
    expect(shapes['På plan']).toEqual({ shape: 'check' })
    expect(shapes['Forsinket']).toEqual({ shape: 'cross' })
  })

  it('keeps the shape an own icon looks like from the colours', () => {
    const time = [status('Forsinket', RED, 'Warning'), status('Mindre forsinkelser', YELLOW)]
    expect(getStatusShapes(time)).toEqual({
      Forsinket: { shape: 'icon', iconName: 'Warning' },
      'Mindre forsinkelser': { shape: 'errorCircle' }
    })
  })

  it('takes a UI Fabric name for the icon it is drawn as: Asterisk keeps the warning', () => {
    const time = [status('Forsinket', RED, 'Asterisk'), status('Mindre forsinkelser', YELLOW)]
    expect(getStatusShapes(time)).toEqual({
      Forsinket: { shape: 'icon', iconName: 'Asterisk' },
      'Mindre forsinkelser': { shape: 'errorCircle' }
    })
    // An alias is looked up by its exact name, as when the icon is drawn: in lower case it is none.
    const lower = [status('Forsinket', RED, 'asterisk'), status('Mindre forsinkelser', YELLOW)]
    expect(shapesOf(lower)).toEqual(['icon', 'warning'])
  })

  it('keeps an own icon for the colour first given with it, and draws the others by their hue', () => {
    const shapes = getStatusShapes([
      status('Foran plan', GREEN, 'Flag'),
      status('På plan', GREEN, 'Flag'),
      status('Mindre forsinkelser', YELLOW, 'Flag'),
      status('Forsinket', RED, 'Flag')
    ])
    expect(shapes).toEqual({
      'Foran plan': { shape: 'icon', iconName: 'Flag' },
      'På plan': { shape: 'icon', iconName: 'Flag' },
      'Mindre forsinkelser': { shape: 'warning' },
      Forsinket: { shape: 'cross' }
    })
  })

  it('reserves the shape for an own icon named with its variant, before the colours are read', () => {
    const risk = [
      status('Lav', GREEN),
      status('Medium', YELLOW),
      status('Høy', RED, 'WarningFilled')
    ]
    expect(shapesOf(risk)).toEqual(['check', 'errorCircle', 'icon'])
  })

  it('reserves each shape drawn with an icon for an own icon of that name', () => {
    const icons = [
      'Checkmark',
      'Warning',
      'Dismiss',
      'CheckmarkCircle',
      'ErrorCircle',
      'Prohibited',
      'Triangle'
    ]
    const shapes = shapesOf([
      ...icons.map((iconName) => status(iconName, BLUE, iconName)),
      status('På plan', GREEN),
      status('Mindre forsinkelser', YELLOW),
      status('Forsinket', RED),
      status('Pause', '#8764b8')
    ])
    // The own icons hold every shape drawn with an icon, so the colours get the neutral ones.
    expect(shapes).toEqual([...icons.map(() => 'icon'), 'dot', 'square', 'diamond', 'ring'])
  })

  it('marks a value without a colour it can read as unknown', () => {
    const odd = [status('Gull', 'gull'), status('Uten farge'), status('På plan', GREEN)]
    expect(shapesOf(odd)).toEqual(['unknown', 'unknown', 'check'])
  })

  it('gives a value configured with a colour name the shape of its hue', () => {
    expect(shapesOf([status('Bra', 'green'), status('Ille', 'Red')])).toEqual(['check', 'cross'])
  })

  it('takes a colour as one however it is written: a name, hex or rgb()', () => {
    const greens = [status('Bra', 'green'), status('Ja', '#008000'), status('Ok', 'rgb(0,128,0)')]
    expect(shapesOf(greens)).toEqual(['check', 'check', 'check'])
  })

  it('leaves out empty values', () => {
    const shapes = getStatusShapes([status('', GREEN), status('På plan', '#107c10')])
    expect(shapes).toEqual({ 'På plan': { shape: 'check' } })
  })

  it('keeps the shape of the hue once every shape is taken', () => {
    const reds = ['#ff0000', '#ee0000', '#dd0000', '#cc0000', '#bb0000', '#aa0000', '#990000']
    const shapes = shapesOf([...reds, '#880000'].map((color) => status(color, color)))
    expect(shapes).toEqual([
      'cross',
      'prohibited',
      'dot',
      'square',
      'diamond',
      'triangle',
      'ring',
      'cross'
    ])
  })
})
