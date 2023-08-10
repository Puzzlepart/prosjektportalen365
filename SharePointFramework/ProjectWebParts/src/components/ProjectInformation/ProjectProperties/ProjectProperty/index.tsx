import { DisplayMode } from '@microsoft/sp-core-library'
import { Link, Persona, PersonaSize } from '@fluentui/react'
import { Toggle } from '@fluentui/react/lib/Toggle'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import styles from './ProjectProperty.module.scss'
import { IProjectPropertyProps } from './types'
import { useProjectInformationContext } from '../../context'

export const ProjectProperty: FC<IProjectPropertyProps> = ({ model, style }) => {
  const context = useProjectInformationContext()

  const renderValueForField = () => {
    switch (model.type) {
      case 'User': {
        return (
          <div>
            <Persona
              text={model.getValue()}
              size={PersonaSize.size24}
              styles={{ root: { marginTop: 6 } }}
            />
          </div>
        )
      }
      case 'UserMulti': {
        return (
          <div>
            {model.getValue<string[]>(';').map((text, key) => (
              <Persona
                key={key}
                text={text}
                size={PersonaSize.size24}
                styles={{ root: { marginTop: 6 } }}
              />
            ))}
          </div>
        )
      }
      case 'TaxonomyFieldTypeMulti': {
        return (
          <div className={styles.labels}>
            {model.getValue<string[]>(';').map((text, key) => (
              <div key={key} title={text} className={styles.termLabel}>
                {text}
              </div>
            ))}
          </div>
        )
      }
      case 'URL': {
        const [url, description] = model.getValue<string[]>(', ')
        return (
          <div>
            <Link href={url} target='_blank'>
              {description}
            </Link>
          </div>
        )
      }
      default: {
        return (
          <div
            className={styles.value}
            dangerouslySetInnerHTML={{
              __html: model.getValue<string>().replace(/\n/g, '<br />')
            }}
          ></div>
        )
      }
    }
  }

  switch (context.props.displayMode) {
    case DisplayMode.Edit: {
      const defaultChecked = context.props.showFieldExternal
        ? context.props.showFieldExternal[model.internalName]
        : false
      return (
        <div className={styles.root} title={model.description} style={style}>
          <div className={styles.label}>{model.displayName}</div>
          <div className={styles.value}>
            <Toggle
              label={strings.ShowFieldExternalUsers}
              inlineLabel={true}
              defaultChecked={defaultChecked}
              onChange={(_event, checked) =>
                context.props.onFieldExternalChanged(model.internalName, checked)
              }
            />
          </div>
        </div>
      )
    }
    default: {
      return (
        <div className={styles.root} style={style}>
          <div className={styles.label}>{model.displayName}</div>
          {renderValueForField()}
        </div>
      )
    }
  }
}

export * from './types'
