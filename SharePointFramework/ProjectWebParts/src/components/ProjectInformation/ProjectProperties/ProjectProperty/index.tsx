import { DisplayMode } from '@microsoft/sp-core-library'
import React, { FC } from 'react'
import styles from './ProjectProperty.module.scss'
import { ProjectPropertyEdit } from './ProjectPropertyEdit'
import { IProjectPropertyProps } from './types'
import { useProjectProperty } from './useProjectProperty'
import { Label } from '@fluentui/react'

export const ProjectProperty: FC<IProjectPropertyProps> = (props) => {
  const { displayMode, renderValueForField } = useProjectProperty(props)
  switch (displayMode) {
    case DisplayMode.Edit: {
      return <ProjectPropertyEdit {...props} />
    }
    default: {
      return (
        <div className={styles.root} style={props.style}>
          <Label>{props.model.displayName}</Label>
          <div>{renderValueForField()}</div>
        </div>
      )
    }
  }
}

export * from './types'
