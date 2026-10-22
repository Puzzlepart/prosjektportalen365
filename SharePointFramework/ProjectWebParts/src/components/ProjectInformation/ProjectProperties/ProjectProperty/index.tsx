import { Text } from '@fluentui/react-components'
import { DisplayMode } from '@microsoft/sp-core-library'
import React, { FC } from 'react'
import { ProjectPropertyEdit } from './ProjectPropertyEdit'
import { IProjectPropertyProps } from './types'
import { useProjectProperty } from './useProjectProperty'
import styles from './ProjectProperty.module.scss'

export const ProjectProperty: FC<IProjectPropertyProps> = (props) => {
  const { displayMode, renderValueForField } = useProjectProperty(props)
  switch (displayMode) {
    case DisplayMode.Edit: {
      return <ProjectPropertyEdit {...props} />
    }
    default: {
      // A term and its description in the properties' description list.
      return (
        <div style={props.style}>
          <dt>
            <Text title={props.model.displayName} weight='semibold' size={200} block truncate>
              {props.model.displayName}
            </Text>
          </dt>
          <dd className={styles.value}>{renderValueForField()}</dd>
        </div>
      )
    }
  }
}

export * from './types'
