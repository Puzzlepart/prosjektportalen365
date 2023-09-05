import { Toggle } from '@fluentui/react/lib/Toggle'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../../context'
import { IProjectPropertyProps } from './types'
import { Text } from '@fluentui/react-components'

export const ProjectPropertyEdit: FC<IProjectPropertyProps> = (props) => {
  const context = useProjectInformationContext()
  const defaultChecked = context.props.showFieldExternal
    ? context.props.showFieldExternal[props.model.internalName]
    : false
  return (
    <div title={props.model.description} style={props.style}>
      <Text weight='semibold' block truncate>
        {props.model.displayName}
      </Text>
      <div>
        <Toggle
          offText={strings.ShowFieldExternalUsersOffText}
          onText={strings.ShowFieldExternalUsersOnText}
          inlineLabel={true}
          defaultChecked={defaultChecked}
          onChange={(_event, checked) =>
            context.props.onFieldExternalChanged(props.model.internalName, checked)
          }
        />
      </div>
    </div>
  )
}
