import { Icon } from '@fluentui/react/lib/Icon'
import React, { FC, useContext } from 'react'
import { SectionContext } from '../../../ProjectStatus/Sections/context'
import { IStatusElementIconProps } from './types'

export const StatusElementIcon: FC<IStatusElementIconProps> = (props) => {
  const { headerProps } = useContext(SectionContext)
  return (
    <Icon
      iconName={headerProps.iconName}
      style={{
        fontSize: props.iconSize,
        color: headerProps.iconColor
      }}
    />
  )
}
