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
import strings from 'PortfolioWebPartsStrings'
import { useProjectProvisionContext } from 'components/ProjectProvision/context'
import React, { useEffect, useState } from 'react'

type UserOption = {
  text?: string
  secondaryText?: string
  id?: string
}

const getUserKey = (user: UserOption) => user?.secondaryText || user?.id || user?.text || ''

export const UserMulti = (props: { type: string; disabled?: boolean }) => {
  const context = useProjectProvisionContext()
  const [query, setQuery] = useState<string>('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    context.column.get(props.type)?.map(getUserKey).filter(Boolean) || []
  )

  const columnValue = context.column.get(props.type)
  useEffect(() => {
    const next = Array.isArray(columnValue) ? columnValue.map(getUserKey).filter(Boolean) : []
    setSelectedUsers((prev) =>
      prev.length === next.length && prev.every((t, i) => t === next[i]) ? prev : next
    )
  }, [columnValue])

  const onOptionSelect: TagPickerProps['onOptionSelect'] = (e, data) => {
    if (data.value === 'no-matches') {
      return
    }

    if (!data.selectedOptions) {
      context.setColumn(props.type, [])
      setSelectedUsers([])
      return
    }

    const currentUsers = context.column.get(props.type) || []
    if (!data.selectedOptions.find((option) => option === data.value)) {
      context.setColumn(
        props.type,
        currentUsers.filter((u) => getUserKey(u) !== data.value)
      )
    } else {
      const selectedUser = matchingUsers.find((u) => getUserKey(u) === data.value)
      if (selectedUser) {
        context.setColumn(props.type, [...currentUsers, selectedUser])
      }
    }

    setSelectedUsers(data.selectedOptions)
    setQuery('')
  }

  const [matchingUsers, setMatchingUsers] = useState<UserOption[]>([])

  useEffect(() => {
    context.props.dataAdapter
      .clientPeoplePickerSearchUser(query, context.column.get(props.type) || [])
      .then((users) =>
        setMatchingUsers(
          users.map((user) => ({
            text: user.text,
            secondaryText: user.secondaryText,
            id: (user as any).id
          }))
        )
      )
  }, [query, columnValue])

  const children = useTagPickerFilter({
    query,
    options: matchingUsers.map(getUserKey).filter(Boolean),
    noOptionsElement: (
      <TagPickerOption value='no-matches'>
        {strings.Provision.UserFieldNoOptionsText}
      </TagPickerOption>
    ),
    renderOption: (userKey) => {
      const user = matchingUsers.find((u) => getUserKey(u) === userKey)

      return (
        <TagPickerOption
          {...({
            key: userKey,
            value: userKey,
            text: user?.text
          } as any)}
        >
          <Persona
            avatar={{
              image: {
                src: `/_layouts/15/userphoto.aspx?size=S&username=${user?.secondaryText}`
              }
            }}
            name={user?.text}
            secondaryText={user?.secondaryText}
          />
        </TagPickerOption>
      )
    },
    filter: (option) =>
      !selectedUsers.includes(option) &&
      [matchingUsers.find((u) => getUserKey(u) === option)?.text, option]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query.toLowerCase()))
  })

  return (
    <TagPicker
      onOptionSelect={onOptionSelect}
      selectedOptions={selectedUsers}
      disabled={props.disabled}
    >
      <TagPickerControl>
        <TagPickerGroup>
          {selectedUsers.map((option) => {
            const user = context.column.get(props.type)?.find((u) => getUserKey(u) === option)
            return (
              <Tag
                key={option}
                media={
                  <Avatar
                    aria-hidden
                    name={user?.text || option}
                    image={{
                      src: `/_layouts/15/userphoto.aspx?size=S&username=${user?.secondaryText}`
                    }}
                    color='colorful'
                  />
                }
                secondaryText={user?.secondaryText}
                value={option}
              >
                {user?.text || option}
              </Tag>
            )
          })}
        </TagPickerGroup>
        <TagPickerInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={strings.Placeholder.UserField}
        />
      </TagPickerControl>
      <TagPickerList>{children}</TagPickerList>
    </TagPicker>
  )
}
