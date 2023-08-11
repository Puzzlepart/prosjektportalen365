import { Toggle } from '@fluentui/react/lib/Toggle'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../../context'
import styles from './ProjectProperty.module.scss'
import { IProjectPropertyProps } from './types'

export const ProjectPropertyEdit: FC<IProjectPropertyProps> = (props) => {
  const context = useProjectInformationContext()
  const defaultChecked = context.props.showFieldExternal
    ? context.props.showFieldExternal[props.model.internalName]
    : false
  return (
    <div className={styles.root} title={props.model.description} style={props.style}>
      <div className={styles.label}>{props.model.displayName}</div>
      <div className={styles.value}>
        <Toggle
          label={strings.ShowFieldExternalUsers}
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
