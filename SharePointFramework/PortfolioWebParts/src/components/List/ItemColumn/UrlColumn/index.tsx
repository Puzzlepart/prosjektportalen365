/* eslint-disable prefer-const */
import { TextField, Toggle } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnDataTypePropertyField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import { IUrlColumnProps } from './types'
import { Link } from '@fluentui/react-components'

export const UrlColumn: ColumnRenderComponent<IUrlColumnProps> = (props) => {
  let [url, description] = props.columnValue.split(', ').filter((v) => !stringIsNullOrEmpty(v))
  const target = props.openInNewTab === false ? '_self' : '_blank'
  if (stringIsNullOrEmpty(description)) {
    description = props.description ?? url
  }
  return (
    <Link href={url} target={target} rel='noopener noreferrer'>
      {props.description}
    </Link>
  )
}

UrlColumn.defaultProps = {
  openInNewTab: false,
  description: null
}
UrlColumn.key = 'url'
UrlColumn.id = 'URL'
UrlColumn.displayName = strings.ColumnRenderOptionUrl
UrlColumn.iconName = 'Link'
UrlColumn.getDataTypeProperties = (onChange, dataTypeProperties: Record<string, any>) => [
  ColumnDataTypePropertyField(Toggle, {
    label: strings.ColumnRenderOptionUrlOpenInNewTabLabel,
    defaultChecked: UrlColumn.defaultProps.openInNewTab,
    checked: dataTypeProperties.openInNewTab,
    onChange: (_, checked) => onChange('openInNewTab', checked)
  }),
  ColumnDataTypePropertyField(TextField, {
    label: strings.ColumnRenderOptionUrlDescriptionLabel,
    description: strings.ColumnRenderOptionUrlDescriptionDescription,
    value: dataTypeProperties.description,
    onChange: (_, value) => onChange('description', value)
  })
]
