import { Avatar, PositioningVirtualElement, Text, Tooltip } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React, { FC, useMemo, useState } from 'react'
import { ColumnRenderComponent } from '../types'
import styles from './UserColumn.module.scss'
import { getUserPhoto } from '../../../util'
import { SearchValueType } from '../../../types'

/**
 * One of several people in a cell, by their initials, the name in a tooltip that shows under the
 * pointer and on focus (WCAG 2.1.1). The tooltip is placed against a stand-in for the initials
 * with no clipping of its own: placed against the initials, Fluent hid it as escaped from the
 * cell, which clips its content, and the name never showed in the hub's lists.
 */
const PersonInitials: FC<{ name: string }> = ({ name }) => {
  const [avatar, setAvatar] = useState<HTMLElement | null>(null)
  const target = useMemo<PositioningVirtualElement | undefined>(
    () => (avatar ? { getBoundingClientRect: () => avatar.getBoundingClientRect() } : undefined),
    [avatar]
  )
  return (
    <Tooltip content={name} relationship='label' withArrow positioning={{ target }}>
      <Avatar
        ref={setAvatar}
        name={name}
        tabIndex={0}
        className={styles.person}
        size={28}
        color='colorful'
        style={{ marginRight: 4 }}
      />
    </Tooltip>
  )
}

/**
 * Displays people values with avatars and readable names.
 */
export const UserColumn: ColumnRenderComponent = ({ columnValue, column }) => {
  const isMultiUser = columnValue?.indexOf(';') !== -1
  if (isMultiUser) {
    return (
      <span>
        {columnValue?.split(';').map((value, key) => (
          <span key={key}>
            {/* The names are only in the tooltips, which show on focus too (WCAG 2.1.1). */}
            <PersonInitials name={value} />
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
          // The name is beside it: read once, not twice (WCAG 1.1.1).
          aria-hidden
          image={{
            src: getUserPhoto(email)
          }}
          size={28}
          color='colorful'
          style={{ marginRight: 4 }}
        />
        <Text className={styles.truncatedText} size={200} truncate>
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
        aria-hidden
        size={28}
        color='colorful'
        style={{ marginRight: 4 }}
      />
      <Text className={styles.truncatedText} size={200} truncate>
        {columnValue}
      </Text>
    </span>
  )
}

UserColumn.key = 'user'
UserColumn.id = 'User'
UserColumn.displayName = strings.ColumnRenderOptionUser
UserColumn.iconName = 'Contact'
