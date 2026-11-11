import { RefCallback } from 'react'
import { FluentIconName } from '../../icons/types'
import type { IDatePickerLocalization } from '../../util/getDatePickerLocalization'
import { IFieldContainerProps } from '../FieldContainer'

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

  /**
   * Whether the picker is disabled.
   */
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

  /**
   * Takes the popup element's ref.
   */
  setPopupRef: RefCallback<HTMLDivElement>

  /**
   * The picker's names, texts, date format and week rule in SharePoint's UI language.
   */
  localization: IDatePickerLocalization
}
