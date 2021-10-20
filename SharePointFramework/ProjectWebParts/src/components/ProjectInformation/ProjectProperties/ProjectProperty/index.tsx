import { DisplayMode } from '@microsoft/sp-core-library'
import { Persona, PersonaSize } from 'office-ui-fabric-react'
import { Toggle } from 'office-ui-fabric-react/lib/Toggle'
import * as strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import styles from './ProjectProperty.module.scss'
import { IProjectPropertyProps } from './types'

export const ProjectProperty = ({
  model,
  style,
  displayMode = DisplayMode.Read,
  onFieldExternalChanged,
  showFieldExternal
}: IProjectPropertyProps) => {

  const renderValue = () => {
    switch (model.type) {
      case 'User': {
        return (
          <div>
            <Persona
              text={model.value}
              size={PersonaSize.size24}
              styles={{ root: { marginTop: 4 } }} />
          </div>
        )
      }
      case 'UserMulti': {
        return (
          <div>
            {model.value.split(';').map((text, key) => (
              <Persona
                key={key}
                text={text}
                size={PersonaSize.size24}
                styles={{ root: { marginTop: 6 } }} />
            ))}
          </div>
        )
      }
      default: {
        return (
          <div
            className={styles.value}
            dangerouslySetInnerHTML={{
              __html: model.value.replace(/\n/g, '<br />')
            }}></div>
        )
      }
    }
  }


  switch (displayMode) {
    case DisplayMode.Edit: {
      const defaultChecked = showFieldExternal ? showFieldExternal[model.internalName] : false
      return (
        <div className={styles.projectProperty} title={model.description} style={style}>
          <div className={styles.label}>{model.displayName}</div>
          <div className={styles.value}>
            <Toggle
              label={strings.ShowFieldExternalUsers}
              inlineLabel={true}
              defaultChecked={defaultChecked}
              onChange={(_event, checked) => onFieldExternalChanged(model.internalName, checked)}
            />
          </div>
        </div>
      )
    }
    default: {
      return (
        <div className={styles.projectProperty} title={model.description} style={style}>
          <div className={styles.label}>{model.displayName}</div>
          {renderValue()}
        </div>
      )
    }
  }
}

export * from './types'
