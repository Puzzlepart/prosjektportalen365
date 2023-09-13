import { Persona } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { SearchValueType, getUserPhoto } from 'pp365-shared-library'

export const UserColumn: ColumnRenderComponent = ({ columnValue, column }) => {
  const isMultiUser = columnValue?.indexOf(';') !== -1
  if (isMultiUser) {
    return (
      <span>
        {columnValue?.split(';').map((value, key) => (
          <span key={key}>
            <Persona
              title={value}
              name={value}
              avatar={{ color: 'colorful' }}
              size='small'
            />
          </span>
        ))}
      </span>
    )
  }
  if (
    column?.data?.searchType === SearchValueType.OWSUSER ||
    column.fieldName.indexOf('OWSUSER') !== -1
  ) {
    const [email, text] = columnValue.split(' | ')
    return (
      <span>
        <Persona
          title={`${text} - ${email}`}
          name={text}
          size='small'
          avatar={{
            color: 'colorful',
            image: {
              src: getUserPhoto(email)
            }
          }}
        />
      </span>
    )
  }
  return (
    <span>
      <Persona
        title={columnValue}
        name={columnValue}
        size='small'
        avatar={{ color: 'colorful' }}
      />
    </span>
  )
}

UserColumn.key = 'user'
UserColumn.id = 'User'
UserColumn.displayName = strings.ColumnRenderOptionUser
UserColumn.iconName = 'Contact'
