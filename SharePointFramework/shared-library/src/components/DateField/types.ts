import { RefCallback } from 'react'
import { FluentIconName } from '../../icons/types'
import type { IDatePickerLocalization } from '../../util/getDatePickerLocalization'
import { IFieldContainerProps } from '../FieldContainer'

/**
 * Configures a localized calendar-day field and its validation feedback.
 */
export interface IDateFieldProps extends Pick<
  IFieldContainerProps,
  'label' | 'description' | 'required' | 'hidden' | 'validationState' | 'validationMessage'
> {
  /**
   * The icon beside the label.
   *
   * @default 'Calendar'
   */
  iconName?: FluentIconName

  /**
   * The day picked, at local midnight, or none.
   */
  value?: Date

  /**
   * Called with the day picked, at local midnight, or with nothing when the day is cleared.
   */
  onSelectDate: (date: Date | undefined) => void

  /**
   * Placeholder of the input. Defaults to the shared date placeholder.
   */
  placeholder?: string

  disabled?: boolean
}

/**
 * What `useDateField` gives `DateField` to render.
 */
export interface IDateFieldState {
  /**
   * The element the calendar popup mounts in, once it is in the document.
   */
  popupRef?: HTMLDivElement

  setPopupRef: RefCallback<HTMLDivElement>

  /**
   * The picker's names, texts, date format and week rule in SharePoint's UI language.
   */
  localization: IDatePickerLocalization

  /**
   * Props for the button that opens the calendar (the picker's `contentAfter` slot): its own name,
   * for the field, in place of Fluent's pointer at the input.
   */
  calendarButtonProps: { 'aria-label': string; 'aria-labelledby': undefined }

  /**
   * Props for the calendar (the picker's `popupSurface` slot): its name in the page's language.
   */
  calendarProps: { 'aria-label': string }
}
