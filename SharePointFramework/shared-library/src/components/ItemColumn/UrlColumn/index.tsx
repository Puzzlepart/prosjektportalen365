/* eslint-disable prefer-const */
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'SharedLibraryStrings'
import React from 'react'
import { switchField, textField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import { IUrlColumnProps } from './types'
import { Link } from '@fluentui/react-components'

export const UrlColumn: ColumnRenderComponent<IUrlColumnProps> = (props) => {
  if (!props.columnValue) {
    return null
  }

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
  switchField({
    label: strings.ColumnRenderOptionUrlOpenInNewTabLabel,
    checked: dataTypeProperties.openInNewTab ?? UrlColumn.defaultProps.openInNewTab,
    onChange: (checked) => onChange('openInNewTab', checked)
  }),
  textField({
    label: strings.ColumnRenderOptionUrlDescriptionLabel,
    description: strings.ColumnRenderOptionUrlDescriptionDescription,
    value: dataTypeProperties.description,
    onChange: (value) => onChange('description', value)
  })
]
