// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The picker's calendar sits in a Fluent popover, whose
// positioning never settles under jsdom and whose teardown took over 30 s on the CI runner; a
// plain popover keeping Fluent's contract (open shows the surface) renders the calendar at once.
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const PopoverContext = React.createContext({ open: false })
  const Popover = ({ open, children }: any) =>
    React.createElement(PopoverContext.Provider, { value: { open } }, children)
  const PopoverTrigger = ({ children }: any) => children
  const PopoverSurface = ({ children }: any) => {
    const { open } = React.useContext(PopoverContext)
    return open ? React.createElement('div', { role: 'dialog' }, children) : null
  }
  return { __esModule: true, ...actual, Popover, PopoverTrigger, PopoverSurface }
})

import { cleanup, render } from '@testing-library/react'
import { DatePicker } from '@fluentui/react-datepicker-compat'
import * as React from 'react'
import { getDatePickerLocalization } from '../../../../util/getDatePickerLocalization'

/**
 * The week numbers Fluent's picker draws from our localization, read off the calendar it renders
 * (the sibling test stands the picker in and checks the props). January 2027 tells the two rules
 * apart: 1 January is a Friday, so by ISO 8601 the week of 28 December is week 53 of 2026 and week
 * 1 starts on Monday 4 January, while the American rule calls the week holding 1 January week 1.
 */
describe('the date picker week numbers', () => {
  afterEach(() => cleanup())

  function weekNumbersOfJanuary2027(locale: string) {
    render(
      <DatePicker
        {...getDatePickerLocalization(locale)}
        value={new Date(2027, 0, 15)}
        showWeekNumbers
        defaultOpen
        showMonthPickerAsOverlay={false}
      />
    )
    // The column's first cell is the empty corner above the numbers.
    return Array.from(document.querySelectorAll('.fui-CalendarDayGrid__weekNumberCell'))
      .map((cell) => cell.textContent.trim())
      .filter(Boolean)
  }

  it('numbers the weeks of January 2027 by ISO 8601 in Norwegian: 53, then 1 from 4 January', () => {
    expect(weekNumbersOfJanuary2027('nb-NO').slice(0, 5)).toEqual(['53', '1', '2', '3', '4'])
  })

  it('numbers them from the week of 1 January in American English', () => {
    expect(weekNumbersOfJanuary2027('en-US').slice(0, 5)).toEqual(['1', '2', '3', '4', '5'])
  })
})
