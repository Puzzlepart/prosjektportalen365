import { Badge, Checkbox, InfoLabel, SearchBox, useId } from '@fluentui/react-components'
import { LockClosedRegular } from '@fluentui/react-icons'
import strings from 'ProjectExtensionsStrings'
import { format, getSearchBoxDismissProps } from 'pp365-shared-library'
import React, { FC } from 'react'
import styles from './SelectionGroup.module.scss'
import { ISelectionGroupProps } from './types'

/**
 * A group of the setup dialog: its title and count, and the items as checkboxes with their
 * descriptions under them. The groups stand under each other, so nothing is behind a tab.
 */
export const SelectionGroup: FC<ISelectionGroupProps> = (props) => {
  const id = useId('selection-group')
  const headingId = `${id}-heading`
  const isEmpty = props.items.length === 0 && !props.searchTerm

  return (
    <div className={styles.root} role='group' aria-labelledby={headingId}>
      <div className={styles.header}>
        <h3 id={headingId} className={styles.heading}>
          {props.title}
        </h3>
        {props.info && (
          <InfoLabel
            className={styles.info}
            infoButton={{ 'aria-label': format(strings.AboutSectionLabel, props.title) }}
            info={props.info}
          />
        )}
        {!isEmpty && (
          <span className={styles.count} role='status'>
            {props.countText}
          </span>
        )}
      </div>
      {isEmpty && <p className={styles.empty}>{props.emptyText}</p>}
      {props.note && <p className={styles.note}>{props.note}</p>}
      {props.showSearch && (
        <SearchBox
          className={styles.search}
          dismiss={getSearchBoxDismissProps()}
          placeholder={props.searchPlaceholder}
          aria-label={props.searchLabel}
          value={props.searchTerm}
          onChange={(_, { value }) => props.onSearch(value)}
          contentAfter={{ onClick: () => props.onSearch('') }}
        />
      )}
      {props.items.length > 0 && (
        <ul className={styles.items}>
          {props.items.map((item) => {
            const key = String(item.key)
            const isLocked = props.lockedKeys.has(key)
            const descriptionId = item.subText ? `${id}-description-${key}` : undefined
            return (
              <li key={key} className={styles.item}>
                <Checkbox
                  className={styles.checkbox}
                  checked={props.selectedKeys.has(key)}
                  // Not `disabled`: a required item is still read and reached with the keyboard.
                  aria-disabled={isLocked || undefined}
                  aria-describedby={descriptionId}
                  onChange={(_, data) => !isLocked && props.onToggle(key, !!data.checked)}
                  label={{
                    className: styles.label,
                    children: (
                      <>
                        <span className={styles.title}>{item.text}</span>
                        {isLocked && (
                          <Badge
                            appearance='outline'
                            color='informative'
                            size='small'
                            icon={<LockClosedRegular />}
                            title={props.lockedText}
                          >
                            {strings.RequiredItemLabel}
                          </Badge>
                        )}
                        {props.renderItemBadge?.(item)}
                      </>
                    )
                  }}
                />
                {item.subText && (
                  <p id={descriptionId} className={styles.description}>
                    {item.subText}
                  </p>
                )}
                {props.renderItemMessage?.(item)}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
