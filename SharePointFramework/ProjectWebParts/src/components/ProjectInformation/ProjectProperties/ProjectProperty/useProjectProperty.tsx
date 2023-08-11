import { IPersonaProps, ITag, Link, Persona, PersonaSize } from '@fluentui/react'
import React from 'react'
import styles from './ProjectProperty.module.scss'
import { IProjectPropertyProps } from './types'

/**
 * Component logic hook for the `ProjectProperty` component.
 *
 * @param props Props for the `ProjectProperty` component
 */
export function useProjectProperty(props: IProjectPropertyProps) {
  /**
   * Renders the value for the field based on the field type.
   *
   * @returns JSX.Element
   */
  const renderValueForField = () => {
    const renderMap = new Map<string, (value: any) => JSX.Element>([
      [
        'User',
        ([user]: IPersonaProps[]) => {
          return <Persona {...user} size={PersonaSize.size24} styles={{ root: { marginTop: 6 } }} />
        }
      ],
      [
        'UserMulti',
        (users: IPersonaProps[]) => {
          return (
            <div>
              {users.map((user, key) => (
                <Persona
                  key={key}
                  {...user}
                  size={PersonaSize.size24}
                  styles={{ root: { marginTop: 6 } }}
                />
              ))}
            </div>
          )
        }
      ],
      [
        'TaxonomyFieldTypeMulti',
        (tags: ITag[]) => (
          <div className={styles.labels}>
            {tags.map((tag, key) => (
              <div key={key} title={tag.name} className={styles.termLabel}>
                {tag.name}
              </div>
            ))}
          </div>
        )
      ],
      ['TaxonomyFieldType', ([tag]: ITag[]) => <div>{tag.name}</div>],
      [
        'URL',
        ([url, description]) => {
          return (
            <div>
              <Link href={url} target='_blank'>
                {description}
              </Link>
            </div>
          )
        }
      ],
      [
        'Note',
        (textValue: string) => (
          <div
            dangerouslySetInnerHTML={{
              __html: textValue.replace(/\n/g, '<br />')
            }}
          ></div>
        )
      ],
      [
        'DateTime',
        (date: Date) => {
          return <div>{date.toLocaleDateString()}</div>
        }
      ]
    ])

    if (renderMap.has(props.model.type)) {
      return renderMap.get(props.model.type)(props.model.getParsedValue())
    } else {
      return <div>{props.model.getParsedValue<string>()}</div>
    }
  }
  return { renderValueForField }
}
