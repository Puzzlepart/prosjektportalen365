// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The date picker is a stand-in that records its props: opening
// Fluent's calendar under jsdom positions a popover, which is slow and shows nothing more.
const pickerProps: { current?: Record<string, any> } = {}
jest.mock('@fluentui/react-datepicker-compat', () => ({
  DatePicker: (props: Record<string, any>) => {
    pickerProps.current = props
    return null
  }
}))

import { act, render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import strings from 'SharedLibraryStrings'
import { DateField } from './DateField'

/**
 * The shared day field's contract with the picker it wraps, which `CustomEditPanel`'s date element
 * and the forms outside it rely on: the field's label reaches the picker, the day and the shared
 * placeholder are handed on, the day is written and read in SharePoint's UI language (jsdom's page
 * names none, so PP365's default, Norwegian), and a pick comes back.
 */
describe('DateField', () => {
  afterEach(() => {
    pickerProps.current = undefined
  })

  it('labels the picker, ties the label to it, and hands it the day and the placeholder', async () => {
    const { container } = render(
      <DateField label='Startdato' value={new Date(2026, 2, 15)} onSelectDate={jest.fn()} />
    )
    await waitFor(() => expect(pickerProps.current).toBeDefined())
    expect(screen.getByText('Startdato')).toBeInTheDocument()
    expect(pickerProps.current.value).toEqual(new Date(2026, 2, 15))
    expect(pickerProps.current.placeholder).toBe(strings.Placeholder.DatePicker)
    // The picker takes the field's id, so a click on the label reaches the date.
    expect(pickerProps.current.id).toEqual(expect.any(String))
    expect(container.querySelector('label')).toHaveAttribute('for', pickerProps.current.id)
    // The calendar mounts in the field's own element, outside a drawer's transform.
    expect(pickerProps.current.mountNode).toBeInstanceOf(HTMLElement)
  })

  it("writes and reads the day in the UI language's short form, with the week numbers", async () => {
    render(<DateField label='Startdato' onSelectDate={jest.fn()} />)
    await waitFor(() => expect(pickerProps.current).toBeDefined())
    expect(pickerProps.current.formatDate(new Date(2026, 2, 15))).toBe('15.03.2026')
    expect(pickerProps.current.parseDateFromString('15.03.2026')).toEqual(new Date(2026, 2, 15))
    expect(pickerProps.current.strings.months[11]).toBe('Desember')
    expect(pickerProps.current.showWeekNumbers).toBe(true)
    expect(pickerProps.current.allowTextInput).toBe(true)
  })

  it('reports the day picked', async () => {
    const onSelectDate = jest.fn()
    render(<DateField label='Startdato' onSelectDate={onSelectDate} />)
    await waitFor(() => expect(pickerProps.current).toBeDefined())
    act(() => pickerProps.current.onSelectDate(new Date(2026, 9, 1)))
    expect(onSelectDate).toHaveBeenCalledWith(new Date(2026, 9, 1))
  })
})
