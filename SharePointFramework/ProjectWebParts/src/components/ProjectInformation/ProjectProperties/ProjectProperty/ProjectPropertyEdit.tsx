import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useState } from 'react'
import { useProjectInformationContext } from '../../context'
import { IProjectPropertyProps } from './types'
import { Switch, Text } from '@fluentui/react-components'

export const ProjectPropertyEdit: FC<IProjectPropertyProps> = (props) => {
  const context = useProjectInformationContext()
  const hasFallbackConfiguration =
    !!context.props.fallbackVisibleFields && context.props.fallbackVisibleFields.length > 0
  const hasLegacyExternalConfiguration =
    !!context.props.showFieldExternal && Object.keys(context.props.showFieldExternal).length > 0
  const defaultChecked = hasFallbackConfiguration
    ? context.props.fallbackVisibleFields.includes(props.model.internalName)
    : hasLegacyExternalConfiguration
      ? !!context.props.showFieldExternal[props.model.internalName]
      : true
  // The v8 Toggle showed a different caption for on and off. The v9 Switch has a
  // single label, so the value is held here to keep that behaviour.
  const [isVisibleExternally, setIsVisibleExternally] = useState(defaultChecked)

  return (
    <div title={props.model.description} style={props.style}>
      <Text weight='semibold' block truncate>
        {props.model.displayName}
      </Text>
      <div>
        <Switch
          label={
            isVisibleExternally
              ? strings.ShowFieldExternalUsersOnText
              : strings.ShowFieldExternalUsersOffText
          }
          checked={isVisibleExternally}
          onChange={(_event, data) => {
            setIsVisibleExternally(data.checked)
            context.props.onFieldExternalChanged(props.model.internalName, data.checked)
          }}
        />
      </div>
    </div>
  )
}
