import React, { FunctionComponent } from 'react'
import { IRenderItemColumnProps } from '../IRenderItemColumnProps'
import { Tag } from './Tag'

export const TagsColumn: FunctionComponent<IRenderItemColumnProps> = ({ columnValue, valueSeparator = ';' }: IRenderItemColumnProps) => {
  if (!columnValue) return null
  const tags: string[] = columnValue.split(valueSeparator)
  return (
    <span>
      {tags.map((text, idx) => (
        <Tag key={idx} text={text} />
      ))}
    </span>
  )
}
