import { Text } from '@fluentui/react-components'
import { DisplayMode } from '@microsoft/sp-core-library'
import React, { FC } from 'react'
import styles from './ProjectProperty.module.scss'
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
        <div className={styles.root} style={props.style}>
          <Text weight='semibold' block>
            {props.model.displayName}
          </Text>
          <Text>{renderValueForField()}</Text>
        </div>
      )
    }
  }
}

export * from './types'
