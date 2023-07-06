import { ITextFieldProps, TextField } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { Tag } from './Tag'
import styles from './TagsColumn.module.scss'
import { ITagsColumnProps } from './types'
import { IColumnDataTypePropertyField } from '../../../ColumnDataTypeField/types'
import { registerColumnRenderComponent } from '../columnRenderComponentRegistry'

export const TagsColumn: ColumnRenderComponent<ITagsColumnProps> = (props) => {
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
TagsColumn.key = 'tags'
TagsColumn.id = 'Tags'
TagsColumn.displayName = strings.ColumnRenderOptionTags
TagsColumn.iconName = 'Tag'
registerColumnRenderComponent(TagsColumn, (onChange, dataTypeProperties: Record<string, any>) => [
  {
    type: TextField,
    props: {
      label: strings.ColumnRenderOptionTagsValueSeparatorLabel,
      description: strings.ColumnRenderOptionTagsValueSeparatorDescription,
      placeholder: TagsColumn.defaultProps.valueSeparator,
      value: dataTypeProperties.valueSeparator,
      onChange: (_, value) => onChange('valueSeparator', value)
    }
  } as IColumnDataTypePropertyField<ITextFieldProps>
])
