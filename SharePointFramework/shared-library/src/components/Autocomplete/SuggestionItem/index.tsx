/* eslint-disable tsdoc/syntax */
import { Icon } from '@fluentui/react'
import React, { FC } from 'react'
import _ from 'underscore'
import styles from './SuggestionItem.module.scss'
import { ISuggestionItemProps } from './types'

/**
 * @category Autocomplete
 */
export const SuggestionItem: FC<ISuggestionItemProps> = (props) => {
  if (props.item.key === -1) {
    return <div data-is-focusable={true}>{props.item.text}</div>
  }

  const classNames = [styles.root, props.item.isSelected && styles.isSelected]
  let iconStyles = {}
  if (typeof props.itemIcons !== 'boolean') {
    iconStyles = props.itemIcons?.style
  }

  return (
    <div
      {..._.omit(props, 'itemIcons', 'item')}
      className={classNames.join(' ')}
      data-is-focusable={true}
    >
      <div className={styles.container}>
        <div
          className={styles.icon}
          style={iconStyles}
          hidden={!props.itemIcons}
        >
          <Icon iconName={props.item.iconName || 'Page'} />
        </div>
        <div className={styles.content}>
          <div className={styles.text}>{props.item.text}</div>
          <div className={styles.secondaryText}>{props.item.secondaryText}</div>
        </div>
      </div>
    </div>
  )
}
