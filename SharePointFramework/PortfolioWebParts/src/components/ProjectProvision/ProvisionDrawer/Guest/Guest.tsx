import {
  TagPickerProps,
  useTagPickerFilter,
  TagPickerOption,
  Avatar,
  Tag,
  TagPicker,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList
} from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { useProjectProvisionContext } from 'components/ProjectProvision/context'
import React, { useState } from 'react'

export const Guest = (props: { disabled?: boolean }) => {
  const context = useProjectProvisionContext()
  const [query, setQuery] = useState<string>('')
  const [selectedGuests, setSelectedGuests] = useState<string[]>(context.column.get('guest') || [])
  const options = [query]

  const onOptionSelect: TagPickerProps['onOptionSelect'] = (_, data) => {
    if (data.value === 'no-matches') {
      return
    }

    if (query && (!query.includes('@') || !query.includes('.'))) {
      return
    }

    if (!data.selectedOptions.find((option) => option === data.value)) {
      context.setColumn(
        'guest',
        context.column.get('guest').filter((guest) => guest !== data.value)
      )
    } else {
      context.setColumn('guest', [...context.column.get('guest'), data.value])
    }

    if (!data.selectedOptions) {
      context.setColumn('guest', [])
    }

    setSelectedGuests(data.selectedOptions)
    setQuery('')
  }

  const children = useTagPickerFilter({
    query,
    options,
    noOptionsElement: (
      <TagPickerOption value='no-matches'>
        {strings.Provision.GuestFieldNoOptionsText}
      </TagPickerOption>
    ),
    renderOption: (guest) => {
      return (
        <TagPickerOption
          key={guest}
          value={guest}
          media={<Avatar aria-hidden name={guest} color='colorful' />}
        >
          {guest}
        </TagPickerOption>
      )
    },
    filter: (option) =>
      !selectedGuests.includes(option) && option.toLowerCase().includes(query.toLowerCase())
  })

  return (
    <div>
      <TagPicker
        onOptionSelect={onOptionSelect}
        selectedOptions={selectedGuests}
        disabled={props.disabled}
      >
        <TagPickerControl>
          <TagPickerGroup>
            {selectedGuests.map((guest) => (
              <Tag
                key={guest}
                media={<Avatar aria-hidden name={guest} color='colorful' />}
                value={guest}
              >
                {guest}
              </Tag>
            ))}
          </TagPickerGroup>
          <TagPickerInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={strings.Placeholder.GuestField}
          />
        </TagPickerControl>
        <TagPickerList>{children}</TagPickerList>
      </TagPicker>
    </div>
  )
}
