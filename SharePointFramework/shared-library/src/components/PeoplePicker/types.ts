import { IPersonaItem } from '../../types'

export interface IPeoplePickerProps {
  /**
   * The people currently picked.
   */
  selected?: IPersonaItem[]

  /**
   * Called with the new selection whenever a person is added or removed.
   */
  onChange: (selected: IPersonaItem[]) => void

  /**
   * Looks up people matching `filter`. `selected` is passed so the search can leave out people who
   * are already picked; `SPDataAdapterBase.clientPeoplePickerSearchUser` does exactly this.
   */
  onResolveSuggestions: (filter: string, selected: IPersonaItem[]) => Promise<IPersonaItem[]>

  /**
   * Whether more than one person can be picked. A single-person picker stops offering its input
   * once someone is picked, so the person is replaced by removing them first.
   *
   * @default false
   */
  multi?: boolean

  /**
   * Placeholder for the input. Defaults to the shared people picker placeholder.
   */
  placeholder?: string

  /**
   * Whether the picker is disabled.
   */
  disabled?: boolean

  /**
   * Accessible name for the input, for pickers not already labelled by a `FieldContainer`.
   */
  'aria-label'?: string

  /**
   * Class applied to the picker's text area.
   */
  className?: string
}
