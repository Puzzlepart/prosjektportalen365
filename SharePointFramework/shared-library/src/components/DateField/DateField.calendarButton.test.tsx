import { DatePicker } from '@fluentui/react-datepicker-compat'
import { act, cleanup, render, screen } from '@testing-library/react'
import * as React from 'react'
import strings from 'SharedLibraryStrings'
import { DateField } from './DateField'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

/** The button beside the input that opens the calendar: Fluent's `contentAfter` slot. */
const calendarButton = () => document.querySelector('.fui-Input__contentAfter')

/**
 * The button that opens the calendar, on Fluent's real `DatePicker` (closed: opening the calendar
 * under jsdom positions a popover, which is slow and shows nothing more). Fluent points it at the
 * input with `aria-labelledby`, so a screen reader read it as the day shown, and an empty field
 * left it without a name (Puzzlepart/prosjektportalen365-testing#129, «Rediger egenskaper»).
 */
describe('DateField, the button that opens the calendar', () => {
  it('says what it does, for the field, whatever the day shown (WCAG 4.1.2)', async () => {
    render(<DateField label='Startdato' value={new Date(2025, 9, 15)} onSelectDate={jest.fn()} />)
    await screen.findByRole('combobox', { name: 'Startdato' })
    const button = calendarButton()
    expect(button).toHaveAttribute('role', 'button')
    expect(button).not.toHaveAttribute('aria-labelledby')
    expect(button).toHaveAccessibleName('Velg dato for Startdato')
    expect(strings.DatePicker.OpenCalendarFor).toBe('Velg dato for {0}')
    // Fluent's own chevron stays the button's content.
    expect(button.querySelector('svg')).not.toBeNull()
  })

  it('has the same name in an empty field, where it had none', async () => {
    render(<DateField label='Sluttdato' onSelectDate={jest.fn()} />)
    await screen.findByRole('combobox', { name: 'Sluttdato' })
    expect(calendarButton()).toHaveAccessibleName('Velg dato for Sluttdato')
  })

  it('is named by the day shown without it, which is why the field names it', () => {
    render(<DatePicker id='dato' value={new Date(2025, 9, 15)} formatDate={() => '15.10.2025'} />)
    expect(calendarButton()).toHaveAttribute('aria-labelledby', 'dato')
    expect(calendarButton()).toHaveAccessibleName('15.10.2025')
  })
})
