import { render, screen } from '@testing-library/react'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import { TrendColumn } from './index'

/**
 * The trend cell: the achievement text, and an icon for the trend when the column asks for one.
 * The value arrives as JSON in the cell, as the portfolio data adapter serialises it. Asserted on
 * the text and on whether an icon element is present, not on which icon library drew it.
 */

const trend = (icon: Record<string, any> | undefined) =>
  JSON.stringify({ AchievementDisplay: '75 %', TrendIcon: icon })

/**
 * Whether an icon is drawn inside the cell, whichever library draws it: v8 renders an `<i>`, v9 an
 * inline `<svg>`.
 */
const hasIcon = (container: HTMLElement) => container.querySelector('i, svg') !== null

describe('TrendColumn', () => {
  it('renders nothing for a cell without a trend', () => {
    const { container } = render(<TrendColumn columnValue={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the achievement', () => {
    render(<TrendColumn columnValue={trend(undefined)} />)
    expect(screen.getByText('75 %')).toBeInTheDocument()
  })

  it('shows an icon when the trend has one', () => {
    const { container } = render(
      <TrendColumn columnValue={trend({ iconName: 'Trophy', color: 'gold' })} />
    )
    expect(hasIcon(container)).toBe(true)
  })

  it('shows no icon when the trend has none', () => {
    const { container } = render(<TrendColumn columnValue={trend(undefined)} />)
    expect(hasIcon(container)).toBe(false)
  })

  it('hides the icon when the column says not to show it', () => {
    const { container } = render(
      <TrendColumn
        columnValue={trend({ iconName: 'Trophy', color: 'gold' })}
        showTrendIcon={false}
      />
    )
    expect(hasIcon(container)).toBe(false)
    expect(screen.getByText('75 %')).toBeInTheDocument()
  })

  it('names the trend its icon shows, which is otherwise only seen (WCAG 1.1.1)', async () => {
    const { container, rerender } = render(
      <TrendColumn columnValue={trend({ iconName: 'Trophy', color: 'gold' })} />
    )
    expect(screen.getByRole('img', { name: strings.Aria.TrendTargetReached })).toBeInTheDocument()
    expect(await axeComponent(container)).toHaveNoViolations()
    rerender(<TrendColumn columnValue={trend({ iconName: 'CaretUp', color: '#27ae60' })} />)
    expect(screen.getByRole('img', { name: strings.Aria.TrendBetter })).toBeInTheDocument()
    rerender(<TrendColumn columnValue={trend({ iconName: 'CaretDown', color: '#e74c3c' })} />)
    expect(screen.getByRole('img', { name: strings.Aria.TrendWorse })).toBeInTheDocument()
    rerender(<TrendColumn columnValue={trend(undefined)} />)
    expect(screen.queryByRole('img')).toBeNull()
  })
})
