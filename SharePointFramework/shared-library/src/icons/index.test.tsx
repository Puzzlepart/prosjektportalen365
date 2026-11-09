import { render } from '@testing-library/react'
import { FluentIcon } from '@fluentui/react-icons'
import React from 'react'
import { fabricIconAliases } from './fabricIconAliases'
import { iconCatalog } from './iconCatalog'
import {
  getFluentIcon,
  getFluentIconWithFallback,
  getFluentIcons,
  getIconComponentWithFallback,
  isIconAvailable,
  resolveFluentIcon
} from './index'

/**
 * The icon helpers every icon in the solutions goes through: a name from code or from list data
 * resolves through the catalog and the UI Fabric aliases, and what nothing resolves falls back to
 * the UI Fabric font. The UI Fabric font is not registered under Jest, and `@fluentui/react` warns
 * once per icon it cannot find; the warning is kept out of the test output.
 */
beforeAll(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined))
afterAll(() => jest.restoreAllMocks())

describe('resolveFluentIcon', () => {
  it('resolves a catalog name to itself', () => {
    expect(resolveFluentIcon('Cube')).toEqual({ name: 'Cube' })
  })

  it('resolves a UI Fabric alias to its catalog entry, filled where the alias says so', () => {
    expect(resolveFluentIcon('BarChart4')).toEqual({ name: 'DataBarVertical' })
    expect(resolveFluentIcon('CircleFill')).toEqual({ name: 'Circle', filled: true })
  })

  it('resolves every alias to an entry the catalog has', () => {
    for (const target of Object.values(fabricIconAliases)) {
      expect(Object.keys(iconCatalog)).toContain(typeof target === 'string' ? target : target.name)
    }
  })

  it('has nothing for an empty or unknown name, nor for a name every object has', () => {
    expect(resolveFluentIcon('')).toBeNull()
    expect(resolveFluentIcon('NoSuchIcon')).toBeNull()
    // List data can hold any text: a key from Object.prototype is not an icon.
    expect(resolveFluentIcon('constructor')).toBeNull()
    expect(resolveFluentIcon('toString')).toBeNull()
  })
})

describe('getFluentIcon', () => {
  it('renders the catalog icon with the colour, size and class asked for', () => {
    const { container } = render(
      <div>{getFluentIcon('Cube', { color: 'red', size: 24, className: 'own' })}</div>
    )
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('own')
    // jsdom reports a computed colour as rgb().
    expect(svg).toHaveStyle({ color: 'rgb(255, 0, 0)', width: '24px', height: '24px' })
  })

  it('gives the bundled component without jsx, the same one each time, so React never remounts it', () => {
    const first = getFluentIcon<FluentIcon>('Cube', { jsx: false })
    expect(first).toBeTruthy()
    expect(getFluentIcon<FluentIcon>('Cube', { jsx: false })).toBe(first)
  })

  it('picks the filled or the regular variant itself when not bundled', () => {
    expect(getFluentIcon<FluentIcon>('Cube', { jsx: false, bundle: false, filled: true })).toBe(
      iconCatalog.Cube.filled
    )
    expect(getFluentIcon<FluentIcon>('Cube', { jsx: false, bundle: false })).toBe(
      iconCatalog.Cube.regular
    )
  })

  it('has nothing for a name outside the catalog, UI Fabric aliases included', () => {
    expect(getFluentIcon('BarChart4' as any)).toBeNull()
    expect(getFluentIcon('' as any)).toBeNull()
  })
})

describe('getFluentIcons', () => {
  it('lists every catalog name, saying which have a filled variant', () => {
    const icons = getFluentIcons()
    expect(icons).toHaveLength(Object.keys(iconCatalog).length)
    expect(icons).toContainEqual({ name: 'Cube', hasFilledIcon: true })
  })
})

describe('getFluentIconWithFallback', () => {
  it('renders a catalog name, and an alias as its catalog icon, filled where the alias says so', () => {
    expect(getFluentIconWithFallback('Circle', { bundle: false }).type).toBe(
      iconCatalog.Circle.regular
    )
    expect(getFluentIconWithFallback('CircleFill', { bundle: false }).type).toBe(
      iconCatalog.Circle.filled
    )
    const { container } = render(<div>{getFluentIconWithFallback('BarChart4', { size: 16 })}</div>)
    expect(container.querySelector('svg')).toHaveStyle({ width: '16px', height: '16px' })
  })

  it('falls back to the UI Fabric font for a name nothing resolves, with the size as the font size', () => {
    const icon = getFluentIconWithFallback('ExcelLogoInverse', {
      size: 20,
      color: 'green',
      className: 'own'
    })
    expect(icon.props).toMatchObject({
      iconName: 'ExcelLogoInverse',
      className: 'own',
      style: { color: 'green', fontSize: 20 }
    })
    const { container } = render(<div>{icon}</div>)
    expect(container.querySelector('[data-icon-name="ExcelLogoInverse"]')).toHaveClass('own')
  })

  it('still takes the older boolean form', () => {
    const icon = getFluentIconWithFallback('Cube', false, 'blue')
    expect(icon.type).toBe(iconCatalog.Cube.regular)
    expect(icon.props.style).toEqual({ color: 'blue' })
  })

  it('has nothing for an empty name', () => {
    expect(getFluentIconWithFallback('')).toBeNull()
    expect(getFluentIconWithFallback(undefined)).toBeNull()
  })
})

describe('getIconComponentWithFallback', () => {
  it('gives the bundled catalog component for a catalog name or an alias, the same each time', () => {
    const cube = getIconComponentWithFallback('Cube')
    expect(getIconComponentWithFallback('Cube')).toBe(cube)
    expect(getFluentIcon<FluentIcon>('Cube', { jsx: false })).toBe(cube)
    expect(getIconComponentWithFallback('BarChart4')).toBe(
      getIconComponentWithFallback('DataBarVertical')
    )
  })

  it('gives the default for an empty name', () => {
    expect(getIconComponentWithFallback('')).toBe(getIconComponentWithFallback('Cube'))
    expect(getIconComponentWithFallback('', 'Calendar')).toBe(
      getIconComponentWithFallback('Calendar')
    )
  })

  it('wraps the UI Fabric font for a name nothing resolves, with a stable identity', () => {
    const Fabric = getIconComponentWithFallback('ExcelLogoInverse')
    expect(getIconComponentWithFallback('ExcelLogoInverse')).toBe(Fabric)
    const { container } = render(<Fabric className='own' />)
    expect(container.querySelector('[data-icon-name="ExcelLogoInverse"]')).toHaveClass('own')
  })
})

describe('isIconAvailable', () => {
  it('knows catalog names and aliases, not UI Fabric names outside the aliases', () => {
    expect(isIconAvailable('Cube')).toBe(true)
    expect(isIconAvailable('CircleFill')).toBe(true)
    expect(isIconAvailable('ExcelLogoInverse')).toBe(false)
    expect(isIconAvailable('')).toBe(false)
  })
})
