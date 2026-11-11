import { RefCallback, useCallback, useMemo, useState } from 'react'
import { getDatePickerLocalization } from '../../util/getDatePickerLocalization'
import { IDateFieldState } from './types'

/**
 * Component logic hook for `DateField`: the element the calendar mounts in, and the picker's
 * localization, read once.
 */
export function useDateField(): IDateFieldState {
  const [popupRef, setPopup] = useState<HTMLDivElement>()
  // A ref callback gets the element, and nothing when it leaves the document.
  const setPopupRef: RefCallback<HTMLDivElement> = useCallback(
    (element) => setPopup(element ?? undefined),
    []
  )
  // The picker in SharePoint's UI language: names, texts, dates, the week and its numbers.
  const localization = useMemo(() => getDatePickerLocalization(), [])
  return { popupRef, setPopupRef, localization }
}
