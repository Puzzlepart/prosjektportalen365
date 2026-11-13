import { TagPickerProps, useFieldContext_unstable } from '@fluentui/react-components'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import strings from 'SharedLibraryStrings'
import { format } from '../../util/format'
import { IPersonaItem } from '../../types'
import { IPeoplePickerProps, IPeoplePickerState } from './types'

/**
 * How long typing pauses before the search runs, in milliseconds.
 */
export const PEOPLE_SEARCH_DELAY = 300

/**
 * Value of the option that says no one was found; picking it does nothing.
 */
export const NO_PEOPLE_FOUND = 'pp365-people-picker-no-results'

/**
 * The key a person is known by in the picker: the claims id the search gives, else the key, the
 * email or the name, whichever the person has.
 */
export function personKey(person: IPersonaItem): string {
  return String(person.id ?? person.key ?? person.secondaryText ?? person.text)
}

/**
 * Component logic hook for `PeoplePicker`: the text typed, the people found for it, and the people
 * picked. The search runs a moment after typing pauses and is told who is picked already; an answer
 * that arrives after a newer search has started is dropped. A field for one person takes no more
 * input while it holds one, as v8's picker at its item limit did.
 *
 * The list of the people picked is named after the field («Nytteeier, valgte personer»). Where the
 * field holds its one person, there is no input for the field's label and hint to belong to, so the
 * list is described by the hint (and by the field's message, when it has one) instead.
 */
export function usePeoplePicker(props: IPeoplePickerProps): IPeoplePickerState {
  const selected = props.selected ?? []
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<IPersonaItem[]>([])
  const [searching, setSearching] = useState(false)
  const latest = useRef({ props, selected })
  latest.current = { props, selected }
  const searchId = useRef(0)

  useEffect(() => {
    const term = query.trim()
    const id = ++searchId.current
    if (!term) {
      setSuggestions([])
      setSearching(false)
      return undefined
    }
    setSearching(true)
    const search = async () => {
      let people: IPersonaItem[] = []
      try {
        people = await latest.current.props.onResolveSuggestions(term, latest.current.selected)
      } catch {
        // A failed search finds no one; the user can type again.
      }
      if (id !== searchId.current) return
      setSuggestions(people ?? [])
      setSearching(false)
    }
    const timer = window.setTimeout(() => {
      void search()
    }, PEOPLE_SEARCH_DELAY)
    return () => window.clearTimeout(timer)
  }, [query])

  const atLimit = !props.multi && selected.length > 0
  const field = useFieldContext_unstable()
  const fieldName = props['aria-label']
  const selectedLabel = fieldName
    ? format(strings.PeoplePickerSelectedFieldLabel, fieldName)
    : strings.PeoplePickerSelectedLabel
  const selectedDescribedBy = atLimit
    ? [field?.validationMessageId, field?.hintId].filter(Boolean).join(' ') || undefined
    : undefined

  const onQueryChange = (event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)

  const onOptionSelect: TagPickerProps['onOptionSelect'] = (_event, data) => {
    if (data.value === NO_PEOPLE_FOUND) return
    const known = [...selected, ...suggestions]
    const people = data.selectedOptions
      .map((key) => known.find((person) => personKey(person) === key))
      .filter((person): person is IPersonaItem => !!person)
    props.onChange(props.multi ? people : people.slice(-1))
    setQuery('')
  }

  return {
    selected,
    query,
    suggestions,
    searching,
    atLimit,
    selectedLabel,
    selectedDescribedBy,
    onQueryChange,
    onOptionSelect
  }
}
