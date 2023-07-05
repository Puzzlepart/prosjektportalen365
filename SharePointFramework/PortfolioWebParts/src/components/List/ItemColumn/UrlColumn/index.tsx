/* eslint-disable prefer-const */
import React, { FC } from 'react'
import { IUrlColumnProps } from './types'
import { Link } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'

export const UrlColumn: FC<IUrlColumnProps> = (props) => {
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
