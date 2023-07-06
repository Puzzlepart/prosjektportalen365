/* eslint-disable prefer-const */
import { ITextFieldProps, IToggleProps, Link, TextField, Toggle } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { IColumnDataTypePropertyField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import { IUrlColumnProps } from './types'
import { ColumnRenderComponentRegistry } from '../registry'

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
ColumnRenderComponentRegistry.register(
  UrlColumn,
  (onChange, dataTypeProperties: Record<string, any>) => [
    {
      type: Toggle,
      props: {
        label: strings.ColumnRenderOptionUrlOpenInNewTabLabel,
        defaultChecked: UrlColumn.defaultProps.openInNewTab,
        checked: dataTypeProperties.openInNewTab,
        onChange: (_, checked) => onChange('openInNewTab', checked)
      }
    } as IColumnDataTypePropertyField<IToggleProps>,
    {
      type: TextField,
      props: {
        label: strings.ColumnRenderOptionUrlDescriptionLabel,
        description: strings.ColumnRenderOptionUrlDescriptionDescription,
        value: dataTypeProperties.description,
        onChange: (_, value) => onChange('description', value)
      }
    } as IColumnDataTypePropertyField<ITextFieldProps>
  ]
)
