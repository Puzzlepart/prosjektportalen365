import { ComboboxProps } from '@fluentui/react-components'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { IAutocompleteProps, ISuggestionItem } from './types'

/**
 * The items as suggestion items: a plain string is its own key, text and search value.
 */
function toSuggestionItems(items: IAutocompleteProps['items'] = []): ISuggestionItem[] {
  return (items as (ISuggestionItem | string)[]).map((item, index) =>
    typeof item === 'string' ? { key: item, text: item, searchValue: item, index } : item
  )
}

/**
 * Component logic hook for `Autocomplete`: the text in the input, the item picked, and the items
 * that match what is typed (all of them while nothing is). A pick reports the item through
 * `onSelected`; clearing reports through `onClear`.
 */
export function useAutocomplete(props: IAutocompleteProps) {
  const items = useMemo(() => toSuggestionItems(props.items), [props.items])
  const defaultItem = items.find((item) => item.key === props.defaultSelectedKey)
  const [value, setValue] = useState(defaultItem?.text ?? '')
  const [selectedKey, setSelectedKey] = useState(defaultItem ? String(defaultItem.key) : undefined)

  // Another default, or other items, start over from the default.
  useEffect(() => {
    setValue(defaultItem?.text ?? '')
    setSelectedKey(defaultItem ? String(defaultItem.key) : undefined)
  }, [props.defaultSelectedKey, items])

  useEffect(() => {
    if (props.selectedKey !== null) return
    setValue('')
    setSelectedKey(undefined)
  }, [props.selectedKey])

  const suggestions = useMemo(() => {
    const term = value.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) => item.searchValue.toLowerCase().includes(term))
  }, [items, value])

  const onChange = (event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value)

  const onOptionSelect: ComboboxProps['onOptionSelect'] = (_event, data) => {
    const item = items.find((candidate) => String(candidate.key) === data.optionValue)
    if (!item) {
      // The clear button picks nothing.
      setValue('')
      setSelectedKey(undefined)
      props.onClear?.()
      return
    }
    setValue(item.text)
    setSelectedKey(String(item.key))
    props.onSelected(item)
  }

  return { value, selectedKey, suggestions, onChange, onOptionSelect } as const
}
