import { Avatar, Persona, Text, Tooltip } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { SearchValueType, getUserPhoto } from 'pp365-shared-library'
import styles from './UserColumn.module.scss'

export const UserColumn: ColumnRenderComponent = ({ columnValue, column }) => {
  const isMultiUser = columnValue?.indexOf(';') !== -1
  if (isMultiUser) {
    return (
      <span>
        {columnValue?.split(';').map((value, key) => (
          <span key={key}>
            <Tooltip content={value} relationship='label' withArrow>
              <Avatar
                title={value}
                name={value}
                size={28}
                color='colorful'
                style={{ marginRight: 4 }}
              />
            </Tooltip>
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
      <span className={styles.avatar}>
        <Avatar
          title={text}
          name={text}
          image={{
            src: getUserPhoto(email)
          }}
          size={28}
          color='colorful'
          style={{ marginRight: 4 }}
        />
        <Text className={styles.truncatedText}>
          {text}
        </Text>
      </span>
    )
  }
  return (
    <span className={styles.avatar}>
      <Avatar
        title={columnValue}
        name={columnValue}
        size={28}
        color='colorful'
        style={{ marginRight: 4 }}
      />
      <Text className={styles.truncatedText}>
        {columnValue}
      </Text>
    </span>
  )
}

UserColumn.key = 'user'
UserColumn.id = 'User'
UserColumn.displayName = strings.ColumnRenderOptionUser
UserColumn.iconName = 'Contact'
