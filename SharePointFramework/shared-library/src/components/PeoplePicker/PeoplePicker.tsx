import { IPersonaProps, NormalPeoplePicker } from '@fluentui/react'
import React, { FC } from 'react'
import strings from 'SharedLibraryStrings'
import { IPersonaItem } from '../../types'
import { IPeoplePickerProps } from './types'

/**
 * Picks people.
 *
 * Fluent UI v9 has no people picker, so this is the v8 `NormalPeoplePicker` behind a v9-shaped API
 * (`selected`, `onChange`, `multi`, a resolver). Every person field in the solutions goes through
 * here, so replacing the inside is a one-file change.
 *
 * The v9 `TagPicker` was tried first and does not survive on this stack: typing into it sends it
 * into an endless render loop that kills the Jest worker, in Fluent's own documented form with none
 * of our code involved. SPFx 1.23 pins React 17 and `TagPicker` is built against React 18. Worth
 * retrying when the SPFx React version moves.
 *
 * Callers supply the search through `onResolveSuggestions` rather than the picker knowing about
 * SharePoint, so the component stays free of data access.
 */
export const PeoplePicker: FC<IPeoplePickerProps> = (props) => {
  const selected = props.selected ?? []
  return (
    <NormalPeoplePicker
      disabled={props.disabled}
      // One person unless the field holds several. At the limit the picker stops offering its
      // input, so a single person is replaced by removing them first.
      itemLimit={props.multi ? 20 : 1}
      styles={{ text: props.className }}
      inputProps={{
        placeholder: props.placeholder ?? strings.Placeholder.PeoplePicker,
        'aria-label': props['aria-label']
      }}
      pickerSuggestionsProps={{ noResultsFoundText: strings.PeoplePickerNoResults }}
      // Our own persona shape carries everything v8 reads off a persona; the cast only tells the
      // compiler that, since `IPersonaItem` is deliberately not a Fluent type.
      defaultSelectedItems={selected as IPersonaProps[]}
      onResolveSuggestions={async (filter, selectedItems) =>
        (await props.onResolveSuggestions(
          filter,
          (selectedItems ?? []) as IPersonaItem[]
        )) as IPersonaProps[]
      }
      onChange={(items) => props.onChange((items ?? []) as IPersonaItem[])}
    />
  )
}

PeoplePicker.displayName = 'PeoplePicker'
