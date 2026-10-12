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

import { render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { EditableSPField } from '../../../../models'
import { getDatePickerLocalization } from '../../../../util/getDatePickerLocalization'
import { CustomEditPanelContext, ICustomEditPanelContext } from '../../context'
import { DateTime } from './DateTime'

/**
 * The date field's picker speaks SharePoint's UI language: the month and day names, its own texts,
 * the dates it writes for screen readers, the first day of the week and the week numbers. Without
 * them Fluent's picker shows "Wednesday", "December" and "Go to today" on a Norwegian site.
 */
describe('DateTime', () => {
  it("gives the picker the UI language's names, texts, date format and week", async () => {
    const context = {
      model: { get: (): Date => undefined, set: jest.fn() }
    } as unknown as ICustomEditPanelContext
    render(
      <CustomEditPanelContext.Provider value={context}>
        <DateTime
          field={{ internalName: 'GtStartDate', displayName: 'Startdato' } as EditableSPField}
        />
      </CustomEditPanelContext.Provider>
    )
    await waitFor(() => expect(pickerProps.current).toBeDefined())
    // jsdom's page has no language, so the UI language is PP365's default, Norwegian.
    const norwegian = getDatePickerLocalization('nb-NO')
    expect(pickerProps.current.strings.months[11]).toBe('Desember')
    expect(pickerProps.current.strings.days[3]).toBe('Onsdag')
    expect(pickerProps.current.strings.goToToday).toBe(norwegian.strings.goToToday)
    expect(
      pickerProps.current.dateTimeFormatter.formatMonthDayYear(
        new Date(2026, 11, 16),
        pickerProps.current.strings
      )
    ).toBe('16. desember 2026')
    expect(pickerProps.current.firstDayOfWeek).toBe(norwegian.firstDayOfWeek)
    expect(pickerProps.current.firstWeekOfYear).toBe(norwegian.firstWeekOfYear)
  })
})
