import { TextField } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnDataTypePropertyField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import { ITagsColumnProps } from './types'
import {
  ChevronCircleRightFilled,
  EarthFilled,
  GlobeLocationFilled,
  TagFilled,
  TagMultipleFilled
} from '@fluentui/react-icons'
import { OverflowTagMenu } from 'pp365-shared-library'
import styles from './TagsColumn.module.scss'

export const TagsColumn: ColumnRenderComponent<ITagsColumnProps> = (props) => {
  if (!props.columnValue) return null

  let icon = TagMultipleFilled

  switch (props.column['internalName']) {
    case 'GtProjectServiceArea':
      icon = GlobeLocationFilled
      break
    case 'GtProjectType':
      icon = TagMultipleFilled
      break
    case 'GtUNSustDevGoals':
      icon = EarthFilled
      break
    case 'GtProjectPhase':
      icon = ChevronCircleRightFilled
      break
    default:
      icon = TagFilled
      break
  }

  const tags: string[] = props.columnValue
    .split(props.valueSeparator)
    .filter((t) => !stringIsNullOrEmpty(t))

  return (
    <div className={styles.root}>
      <OverflowTagMenu tags={tags.map((tag) => tag && tag)} icon={icon} />
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
TagsColumn.getDataTypeProperties = (onChange, dataTypeProperties: Record<string, any>) => [
  ColumnDataTypePropertyField(TextField, {
    label: strings.ColumnRenderOptionTagsValueSeparatorLabel,
    description: strings.ColumnRenderOptionTagsValueSeparatorDescription,
    placeholder: TagsColumn.defaultProps.valueSeparator,
    value: dataTypeProperties.valueSeparator,
    onChange: (_, value) => onChange('valueSeparator', value)
  })
]
