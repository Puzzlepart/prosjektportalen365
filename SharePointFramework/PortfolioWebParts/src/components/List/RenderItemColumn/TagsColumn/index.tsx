import { stringIsNullOrEmpty } from '@pnp/common'
import React, { FC } from 'react'
import { IRenderItemColumnProps } from '../types'
import { Tag } from './Tag'
import styles from './TagsColumn.module.scss'

export const TagsColumn: FC<IRenderItemColumnProps> = ({
  columnValue,
  valueSeparator = ';',
  style
}: IRenderItemColumnProps) => {
  if (!columnValue) return null
  const tags: string[] = columnValue.split(valueSeparator).filter((t) => !stringIsNullOrEmpty(t))
  return (
    <div className={styles.root} style={style}>
      {tags.map((text, idx) => (
        <Tag key={idx} text={text} />
      ))}
    </div>
  )
}
