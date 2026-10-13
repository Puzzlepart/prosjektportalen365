import { act, cleanup, render } from '@testing-library/react'
import { DatePicker } from '@fluentui/react-datepicker-compat'
import * as React from 'react'
import { getDatePickerLocalization } from '../../../../util/getDatePickerLocalization'

/**
 * The week numbers Fluent's picker draws from our localization, read off the calendar it renders
 * (the sibling test stands the picker in and checks the props). January 2027 tells the two rules
 * apart: 1 January is a Friday, so by ISO 8601 the week of 28 December is week 53 of 2026 and week
 * 1 starts on Monday 4 January, while the American rule calls the week holding 1 January week 1.
 * The picker is opened with the real DatePicker, which costs seconds under jsdom, once per locale.
 */
describe('the date picker week numbers', () => {
  // Fluent keeps positioning the popover after a test ends; let it settle before the next one.
  // Tearing an open popover down takes seconds under jsdom, more than a hook's default 5.
  afterEach(async () => {
    cleanup()
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  }, 30_000)

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
