import {
  Persona,
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
import { useProjectProvisionContext } from 'components/ProjectProvision/context'
import React, { useEffect, useState } from 'react'

export const User = (props: { type: string; disabled?: boolean }) => {
  const context = useProjectProvisionContext()
  const [query, setQuery] = useState<string>('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    context.column.get(props.type)?.map((user) => user?.text) || []
  )

  const onOptionSelect: TagPickerProps['onOptionSelect'] = (e, data) => {
    if (data.value === 'no-matches') {
      return
    }

    if (!data.selectedOptions.find((option) => option === data.value)) {
      context.setColumn(
        props.type,
        context.column.get(props.type).filter((u) => u.text !== data.value)
      )
    } else {
      context.setColumn(props.type, [
        ...context.column.get(props.type),
        matchingUsers.find((u) => u.text === data.value)
      ])
    }

    if (!data.selectedOptions) {
      context.setColumn(props.type, [])
    }

    setSelectedUsers(data.selectedOptions)
    setQuery('')
  }

  const [matchingUsers, setMatchingUsers] = useState([])

  useEffect(() => {
    context.props.dataAdapter
      .clientPeoplePickerSearchUser(query, [])
      .then((users) =>
        setMatchingUsers(
          users.map((user) => ({ text: user.text, secondaryText: user.secondaryText }))
        )
      )
  }, [query])

  const children = useTagPickerFilter({
    query,
    options: matchingUsers.map((user) => user.text),
    noOptionsElement: <TagPickerOption value='no-matches'>Ingen treff</TagPickerOption>,
    renderOption: (user) => {
      const secondaryText = matchingUsers.find((u) => u.text === user)?.secondaryText

      return (
        <TagPickerOption key={user} value={user}>
          <Persona
            avatar={{
              image: {
                src: `/_layouts/15/userphoto.aspx?size=S&username=${secondaryText}`
              }
            }}
            name={user}
            secondaryText={secondaryText}
          />
        </TagPickerOption>
      )
    },
    filter: (option) =>
      !selectedUsers.includes(option) && option.toLowerCase().includes(query.toLowerCase())
  })

  return (
    <TagPicker
      onOptionSelect={onOptionSelect}
      selectedOptions={selectedUsers}
      disabled={props.disabled}
    >
      <TagPickerControl>
        <TagPickerGroup>
          {selectedUsers.map((option) => (
            <Tag
              key={option}
              media={
                <Avatar
                  aria-hidden
                  name={option}
                  image={{
                    src: `/_layouts/15/userphoto.aspx?size=S&username=${
                      context.column.get(props.type)?.find((u) => u?.text === option)?.secondaryText
                    }`
                  }}
                  color='colorful'
                />
              }
              value={option}
            >
              {option}
            </Tag>
          ))}
        </TagPickerGroup>
        <TagPickerInput value={query} onChange={(e) => setQuery(e.target.value)} />
      </TagPickerControl>
      <TagPickerList>{children}</TagPickerList>
    </TagPicker>
  )
}
