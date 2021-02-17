import React, { Component } from 'react'
import { IRenderItemColumnProps } from '../IRenderItemColumnProps'
import { Tag } from './Tag'

// eslint-disable-next-line @typescript-eslint/ban-types
export class TagsColumn extends Component<IRenderItemColumnProps, {}> {
  public render(): React.ReactElement<IRenderItemColumnProps> {
    const tags: string[] = this.props.colValue.split(';')
    return (
      <span>
        {tags.map((text, idx) => (
          <Tag key={idx} text={text} />
        ))}
      </span>
    )
  }
}
