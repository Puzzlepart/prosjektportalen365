/* eslint-disable prefer-const */
import { ITextFieldProps, IToggleProps, Link, TextField, Toggle } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { IUrlColumnProps } from './types'
import strings from 'PortfolioWebPartsStrings'

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
UrlColumn.getDataTypeOption = () => ({
  key: UrlColumn.key,
  id: UrlColumn.id,
  text: UrlColumn.displayName,
  data: {
    iconProps: { iconName: UrlColumn.iconName },
    getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
      [
        Toggle,
        {
          label: strings.ColumnRenderOptionUrlOpenInNewTabLabel,
          checked: dataTypeProperties.openInNewTab ?? UrlColumn.defaultProps.openInNewTab,
          onChange: (_, checked) => onChange('openInNewTab', checked)
        } as IToggleProps
      ],
      [
        TextField,
        {
          label: strings.ColumnRenderOptionUrlDescriptionLabel,
          description: strings.ColumnRenderOptionUrlDescriptionDescription,
          value: dataTypeProperties.description,
          onChange: (_, value) => onChange('description', value)
        } as ITextFieldProps
      ]
    ]
  }
})
