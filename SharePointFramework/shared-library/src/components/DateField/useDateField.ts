import { RefCallback, useCallback, useMemo, useState } from 'react'
import strings from 'SharedLibraryStrings'
import { format } from '../../util/format'
import { getDatePickerLocalization } from '../../util/getDatePickerLocalization'
import { IDateFieldProps, IDateFieldState } from './types'

/**
 * Component logic hook for `DateField`: the element the calendar mounts in, the picker's
 * localization, read once, and the names of the button that opens the calendar and of the
 * calendar.
 *
 * Fluent names the button by the input (`aria-labelledby`), so it was read as the day shown
 * («15.10.2025», nothing in an empty field), and the calendar «Calendar», in English (WCAG 3.1.2,
 * 4.1.2). The button says what it does, for the field: «Velg dato for Startdato».
 */
export function useDateField(props: Pick<IDateFieldProps, 'label'> = {}): IDateFieldState {
  const [popupRef, setPopup] = useState<HTMLDivElement>()
  const setPopupRef: RefCallback<HTMLDivElement> = useCallback(
    (element) => setPopup(element ?? undefined),
    []
  )
  const localization = useMemo(() => getDatePickerLocalization(), [])
  const fieldName = typeof props.label === 'string' ? props.label : undefined
  const calendarButtonProps = {
    'aria-label': fieldName
      ? format(strings.DatePicker.OpenCalendarFor, fieldName)
      : strings.DatePicker.OpenCalendar,
    // Fluent points the button at the input's id, which named it after the day shown.
    'aria-labelledby': undefined
  }
  const calendarProps = { 'aria-label': strings.DatePicker.Calendar }
  return { popupRef, setPopupRef, localization, calendarButtonProps, calendarProps }
}
