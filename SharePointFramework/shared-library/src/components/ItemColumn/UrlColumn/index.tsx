import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'SharedLibraryStrings'
import React from 'react'
import { switchField, textField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import { IUrlColumnProps } from './types'
import { Link } from '@fluentui/react-components'
import { withDefaults } from '../../../util'

const URL_COLUMN_DEFAULT_PROPS: Partial<IUrlColumnProps> = {
  openInNewTab: false,
  description: null
}

export const UrlColumn: ColumnRenderComponent<IUrlColumnProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, URL_COLUMN_DEFAULT_PROPS)
  if (!props.columnValue) {
    return null
  }

  const [url, ownDescription] = props.columnValue.split(', ').filter((v) => !stringIsNullOrEmpty(v))
  const target = props.openInNewTab === false ? '_self' : '_blank'
  // The column's description first, as its setting says, then the link's own, then the address:
  // a link always has a text to be read and found by (WCAG 2.4.4).
  const text = [props.description, ownDescription, url].find((v) => !stringIsNullOrEmpty(v))
  return (
    <Link href={url} target={target} rel='noopener noreferrer'>
      {text}
    </Link>
  )
}
UrlColumn.key = 'url'
UrlColumn.id = 'URL'
UrlColumn.displayName = strings.ColumnRenderOptionUrl
UrlColumn.iconName = 'Link'
UrlColumn.getDataTypeProperties = (onChange, dataTypeProperties: Record<string, any>) => [
  switchField({
    label: strings.ColumnRenderOptionUrlOpenInNewTabLabel,
    checked: dataTypeProperties.openInNewTab ?? URL_COLUMN_DEFAULT_PROPS.openInNewTab,
    onChange: (checked) => onChange('openInNewTab', checked)
  }),
  textField({
    label: strings.ColumnRenderOptionUrlDescriptionLabel,
    description: strings.ColumnRenderOptionUrlDescriptionDescription,
    value: dataTypeProperties.description,
    onChange: (value) => onChange('description', value)
  })
]
