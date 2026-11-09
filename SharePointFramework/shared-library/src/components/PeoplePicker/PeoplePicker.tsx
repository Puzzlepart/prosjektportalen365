import {
  Avatar,
  Tag,
  TagPicker,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption
} from '@fluentui/react-components'
import { ChevronDownRegular } from '@fluentui/react-icons'
import React, { FC } from 'react'
import strings from 'SharedLibraryStrings'
import { IPersonaItem } from '../../types'
import { IPeoplePickerProps } from './types'
import { NO_PEOPLE_FOUND, personKey, usePeoplePicker } from './usePeoplePicker'

/**
 * The person's picture, or their initials where there is none. Hidden from screen readers: the
 * person's name is beside it, and would otherwise be read twice (WCAG 1.1.1).
 */
const PersonAvatar: FC<{ person: IPersonaItem; shape?: 'circular' | 'square' }> = ({
  person,
  shape
}) => (
  <Avatar
    aria-hidden
    name={person.text}
    image={person.imageUrl ? { src: person.imageUrl } : undefined}
    shape={shape}
    color='colorful'
  />
)

/**
 * Picks people, on Fluent UI v9's `TagPicker`: the people picked as tags, an input that searches as
 * the user types, and the people found as options with their picture and email.
 *
 * Phase 3 (Decision B) kept v8's `NormalPeoplePicker` inside because `TagPicker` looped the Jest
 * worker when typed into. That loop is the combobox family under jsdom on React 17, not the
 * browser: Fluent's own example on React 17 typed, picked and removed in a handful of renders in
 * Chromium (phase 4, slice 7). Tests type into it through the harness's stand-in
 * (`pp365-jest-config/lib/tagPickerStandIn`).
 *
 * Callers supply the search through `onResolveSuggestions` rather than the picker knowing about
 * SharePoint, so the component stays free of data access. In a Fluent `Field` the input takes the
 * field's label.
 */
export const PeoplePicker: FC<IPeoplePickerProps> = (props) => {
  const { selected, query, suggestions, searching, atLimit, onQueryChange, onOptionSelect } =
    usePeoplePicker(props)

  return (
    <TagPicker
      onOptionSelect={onOptionSelect}
      selectedOptions={selected.map(personKey)}
      disabled={props.disabled}
    >
      <TagPickerControl
        className={props.className}
        // Fluent names the button that opens the list after the input, in English, and leaves it
        // nameless in a field for one that holds one, where there is no input and nothing to
        // show (WCAG 3.1.2, 4.1.2): it has a name from the strings, and there it is left out.
        expandIcon={
          atLimit
            ? null
            : { 'aria-label': strings.PeoplePickerExpandLabel, children: <ChevronDownRegular /> }
        }
      >
        <TagPickerGroup aria-label={strings.PeoplePickerSelectedLabel}>
          {selected.map((person) => (
            <Tag
              key={personKey(person)}
              value={personKey(person)}
              shape='rounded'
              media={<PersonAvatar person={person} />}
            >
              {person.text}
            </Tag>
          ))}
        </TagPickerGroup>
        {!atLimit && (
          <TagPickerInput
            aria-label={props['aria-label']}
            placeholder={props.placeholder ?? strings.Placeholder.PeoplePicker}
            value={query}
            onChange={onQueryChange}
          />
        )}
      </TagPickerControl>
      <TagPickerList>
        {suggestions.map((person) => (
          <TagPickerOption
            key={personKey(person)}
            value={personKey(person)}
            text={person.text}
            secondaryContent={person.secondaryText}
            media={<PersonAvatar person={person} shape='square' />}
          >
            {person.text}
          </TagPickerOption>
        ))}
        {query.trim() && !searching && suggestions.length === 0 && (
          <TagPickerOption value={NO_PEOPLE_FOUND} text={strings.PeoplePickerNoResults}>
            {strings.PeoplePickerNoResults}
          </TagPickerOption>
        )}
      </TagPickerList>
    </TagPicker>
  )
}

PeoplePicker.displayName = 'PeoplePicker'
