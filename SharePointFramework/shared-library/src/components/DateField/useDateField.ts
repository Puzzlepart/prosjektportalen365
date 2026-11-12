import { RefCallback, useCallback, useMemo, useState } from 'react'
import { getDatePickerLocalization } from '../../util/getDatePickerLocalization'
import { IDateFieldState } from './types'

/**
 * Component logic hook for `DateField`: the element the calendar mounts in, and the picker's
 * localization, read once.
 */
export function useDateField(): IDateFieldState {
  const [popupRef, setPopup] = useState<HTMLDivElement>()
  const setPopupRef: RefCallback<HTMLDivElement> = useCallback(
    (element) => setPopup(element ?? undefined),
    []
  )
  const localization = useMemo(() => getDatePickerLocalization(), [])
  return { popupRef, setPopupRef, localization }
}
