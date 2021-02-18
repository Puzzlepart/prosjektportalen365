import React, { FunctionComponent } from 'react'
import { IRenderItemColumnProps } from '../IRenderItemColumnProps'
import { Tag } from './Tag'

export const TagsColumn: FunctionComponent<IRenderItemColumnProps> = ({ colValue }: IRenderItemColumnProps) => {
  const tags: string[] = colValue.split(';')
  return (
    <span>
      {tags.map((text, idx) => (
        <Tag key={idx} text={text} />
      ))}
    </span>
  )
}
