import { DisplayMode } from '@microsoft/sp-core-library'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../../context'
import styles from './ProjectProperty.module.scss'
import { ProjectPropertyEdit } from './ProjectPropertyEdit'
import { IProjectPropertyProps } from './types'
import { useProjectProperty } from './useProjectProperty'
import { Label } from '@fluentui/react'

export const ProjectProperty: FC<IProjectPropertyProps> = (props) => {
  const context = useProjectInformationContext()
  const { renderValueForField } = useProjectProperty(props)
  switch (context.props.displayMode) {
    case DisplayMode.Edit: {
      return <ProjectPropertyEdit {...props} />
    }
    default: {
      return (
        <div className={styles.root} style={props.style}>
          <Label>{props.model.displayName}</Label>
          {renderValueForField()}
        </div>
      )
    }
  }
}

export * from './types'
