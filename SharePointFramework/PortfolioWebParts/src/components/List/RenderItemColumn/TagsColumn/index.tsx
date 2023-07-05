import { stringIsNullOrEmpty } from '@pnp/common'
import React, { FC } from 'react'
import { Tag } from './Tag'
import styles from './TagsColumn.module.scss'
import { ITagsColumnProps } from './types'

export const TagsColumn: FC<ITagsColumnProps> = (props) => {
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

TagsColumn.defaultProps = {
  valueSeparator: ';'
}
