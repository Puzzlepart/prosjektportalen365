// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The gauge draws an SVG of its own, not under test here. Fluent
// positions an open popover against its trigger, slow under jsdom: the popover is stood in for by
// one that shows its surface, with the props it is given, and records whether it was asked to trap
// the focus; the browser presses the keys.
jest.mock('react-gauge-component', () => ({
  __esModule: true,
  default: () => jest.requireActual('react').createElement('svg', { 'data-gauge': true })
}))
const popover: { trapFocus?: boolean } = {}
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  return {
    ...actual,
    Popover: ({ trapFocus, children }: any) => {
      popover.trapFocus = trapFocus
      return React.createElement(React.Fragment, null, children)
    },
    PopoverTrigger: ({ children }: any) => children,
    PopoverSurface: ({ children, ...props }: any) =>
      React.createElement('div', { 'data-surface': true, ...props }, children)
  }
})

import { render, screen } from '@testing-library/react'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import { InstrumentColumn } from '.'
import { format } from '../../../util'

/**
 * The instrument cell: a link with the latest measurement that opens a gauge. The gauge is a
 * drawing, so it is named by what it shows, and the popover takes the focus, so a screen reader
 * hears it open, and is named by the indicator.
 */
const item = {
  GtStartValueOWSNMBR: 10,
  GtDesiredValueOWSNMBR: 50,
  LastMeasurementValue: 30,
  GtMeasurementUnitOWSCHCS: 'kr',
  MeasurementIndicator: 'Sparte kroner'
}

describe('InstrumentColumn', () => {
  it('names the gauge by the measurement, the start value and the target (WCAG 1.1.1)', () => {
    render(<InstrumentColumn item={item} column={{ name: 'Måling' } as any} />)
    expect(
      screen.getByRole('img', { name: format(strings.Aria.InstrumentGaugeLabel, 30, 10, 50) })
    ).toBeInTheDocument()
    expect(screen.getByText(format(strings.InstrumentUnitLabel, 'kr'))).toBeInTheDocument()
  })

  it('takes the focus as it opens and keeps it, named by the indicator (WCAG 2.4.3, 4.1.2)', () => {
    const { container, rerender } = render(
      <InstrumentColumn item={item} column={{ name: 'Måling' } as any} />
    )
    expect(popover.trapFocus).toBe(true)
    const surface = container.querySelector('[data-surface]')
    // A surface with a tab index is what Fluent focuses when it holds no control.
    expect(surface).toHaveAttribute('tabindex', '-1')
    expect(surface).toHaveAttribute('aria-label', 'Sparte kroner')
    // Described by what it shows, which a screen reader reads as the focus lands on it.
    expect(surface).toHaveAccessibleDescription(
      `${format(strings.Aria.InstrumentGaugeLabel, 30, 10, 50)} ${format(strings.InstrumentUnitLabel, 'kr')}`
    )
    rerender(
      <InstrumentColumn
        item={{ ...item, MeasurementIndicator: undefined }}
        column={{ name: 'Måling' } as any}
      />
    )
    expect(container.querySelector('[data-surface]')).toHaveAttribute('aria-label', 'Måling')
  })
})
