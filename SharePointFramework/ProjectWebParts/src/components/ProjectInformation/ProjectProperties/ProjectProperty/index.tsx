import { Text } from '@fluentui/react-components'
import { DisplayMode } from '@microsoft/sp-core-library'
import React, { FC } from 'react'
import { ProjectPropertyEdit } from './ProjectPropertyEdit'
import { IProjectPropertyProps } from './types'
import { useProjectProperty } from './useProjectProperty'

export const ProjectProperty: FC<IProjectPropertyProps> = (props) => {
  const { displayMode, renderValueForField } = useProjectProperty(props)
  switch (displayMode) {
    case DisplayMode.Edit: {
      return <ProjectPropertyEdit {...props} />
    }
    default: {
      return (
        <div style={props.style}>
          <Text title={props.model.displayName} weight='semibold' size={200} block truncate>
            {props.model.displayName}
          </Text>
          <Text color='var(--colorNeutralForeground2)'>{renderValueForField()}</Text>
        </div>
      )
    }
  }
}

export * from './types'
