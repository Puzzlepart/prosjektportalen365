import { Combobox, Field, Option } from '@fluentui/react-components'
import React, { FC } from 'react'
import { getFluentIconWithFallback } from '../../icons'
import { IAutocompleteProps } from './types'
import { useAutocomplete } from './useAutocomplete'

/**
 * An input that offers the items matching what is typed, on Fluent UI v9's `Combobox` in freeform
 * mode: the arrow keys move through the matches, Enter or a click picks one, and what is typed may
 * also stay as it is. With a label, a description or an error message it sits in a Fluent `Field`.
 */
export const Autocomplete: FC<IAutocompleteProps> = (props) => {
  const { value, selectedKey, suggestions, onChange, onOptionSelect } = useAutocomplete(props)

  const combobox = (
    <Combobox
      freeform
      clearable
      className={props.className}
      placeholder={props.placeholder}
      disabled={props.disabled}
      value={value}
      selectedOptions={selectedKey ? [selectedKey] : []}
      onChange={onChange}
      onOptionSelect={onOptionSelect}
      listbox={props.maxHeight ? { style: { maxHeight: props.maxHeight } } : undefined}
    >
      {suggestions.map((item) => (
        <Option key={item.key} value={String(item.key)} text={item.text} disabled={item.disabled}>
          {props.itemIcons && item.iconName && getFluentIconWithFallback(item.iconName)}
          {item.text}
        </Option>
      ))}
      {suggestions.length === 0 && props.noSuggestionsText && (
        <Option key='no-suggestions' value='no-suggestions' text={props.noSuggestionsText} disabled>
          {props.noSuggestionsText}
        </Option>
      )}
    </Combobox>
  )

  if (!props.label && !props.description && !props.errorMessage) return combobox
  return (
    <Field
      label={props.label}
      hint={props.description}
      validationMessage={props.errorMessage}
      required={props.required}
    >
      {combobox}
    </Field>
  )
}

export * from './types'
