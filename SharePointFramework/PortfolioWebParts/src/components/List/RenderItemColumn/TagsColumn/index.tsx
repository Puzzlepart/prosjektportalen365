import { stringIsNullOrEmpty } from '@pnp/common'
import React, { FC } from 'react'
import { IRenderItemColumnProps } from '../types'
import { Tag } from './Tag'
import styles from './TagsColumn.module.scss'

export const TagsColumn: FC<IRenderItemColumnProps> = (props) => {
  if (!props.columnValue) return null
  const tags: string[] = props.columnValue
    .split(props.valueSeparator)
    .filter((t) => !stringIsNullOrEmpty(t))
  return (
    <div className={styles.root} style={props.style}>
      {tags.map((text, idx) => (
        <Tag key={idx} text={text} />
      ))}
    </div>
  )
}

TagsColumn.displayName = 'TagsColumn'
TagsColumn.defaultProps = {
  valueSeparator: ';'
}
