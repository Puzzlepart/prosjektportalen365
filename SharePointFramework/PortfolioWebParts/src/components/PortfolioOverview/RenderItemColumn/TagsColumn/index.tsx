import { stringIsNullOrEmpty } from '@pnp/common'
import React, { FunctionComponent } from 'react'
import { IRenderItemColumnProps } from '../IRenderItemColumnProps'
import { Tag } from './Tag'
import styles from './TagsColumn.module.scss'

export const TagsColumn: FunctionComponent<IRenderItemColumnProps> = ({ columnValue, valueSeparator = ';', style }: IRenderItemColumnProps) => {
  if (!columnValue) return null
  const tags: string[] = columnValue
  .split(valueSeparator)
  .filter(t => !stringIsNullOrEmpty(t))
  return (
    <div className={styles.root} style={style}>
      {tags.map((text, idx) => (
        <Tag key={idx} text={text} />
      ))}
    </div>
  )
}
