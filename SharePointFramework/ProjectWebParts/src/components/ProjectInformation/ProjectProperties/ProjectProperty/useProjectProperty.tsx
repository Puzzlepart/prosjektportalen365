import { IPersonaProps, ITag, Link } from '@fluentui/react'
import React from 'react'
import { useProjectInformationContext } from '../../context'
import { IProjectPropertyProps } from './types'
import { Persona } from '@fluentui/react-components'
import { OverflowTagMenu } from 'pp365-shared-library'
import { ChevronCircleRightFilled, EarthFilled, GlobeLocationFilled, TagFilled, TagMultipleFilled } from '@fluentui/react-icons'


/**
 * Component logic hook for the `ProjectProperty` component.
 *
 * @param props Props for the `ProjectProperty` component
 *
 * @returns a render function `renderValueForField` for the `ProjectProperty` component,
 * aswell as the `displayMode` for the `ProjectProperty` component.
 */
export function useProjectProperty(props: IProjectPropertyProps) {
  const context = useProjectInformationContext()

  /**
   * Renders the value for the field based on the field type.
   *
   * @returns JSX.Element
   */
  const renderValueForField = () => {
    let icon = TagMultipleFilled

    switch (props.model.internalName) {
      case 'GtProjectServiceArea':
        icon = GlobeLocationFilled
        break
      case 'GtProjectType':
        icon = TagMultipleFilled
        break
      case 'GtUNSustDevGoals':
        icon = EarthFilled
        break
      case 'GtProjectPhase':
        icon = ChevronCircleRightFilled
        break
      default:
        icon = TagFilled
        break
    }

    const renderMap = new Map<string, (value: any) => JSX.Element>([
      [
        'User',
        ([user]: IPersonaProps[]) => {
          return (
            <Persona
              {...user}
              title={user.text}
              name={user.text}
              size='small'
              avatar={{
                image: {
                  src: user.imageUrl
                }
              }}
              style={{ marginTop: 6 }}
            />
          )
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
                  title={user.text}
                  name={user.text}
                  size='small'
                  avatar={{
                    image: {
                      src: user.imageUrl
                    }
                  }}
                  style={{ marginTop: 6 }}
                />
              ))}
            </div>
          )
        }
      ],
      [
        'TaxonomyFieldTypeMulti',
        (tags: ITag[]) => (
          <OverflowTagMenu
            text={props.model.displayName}
            tags={tags.map((tag) => tag && tag.name)}
            icon={icon}
          />
        )
      ],
      ['TaxonomyFieldType', ([tag]: ITag[]) => (
        <OverflowTagMenu
          text={props.model.displayName}
          tags={[tag.name]}
          icon={icon}
        />
      )
      ],
      [
        'URL',
        ({ url, description }) => {
          return (
            <div>
              <Link href={url} target='_blank' title={description}>
                {description ?? url}
              </Link>
            </div>
          )
        }
      ],
      [
        'Note',
        (textValue: string) => (
          <div
            title={textValue.replace(/\n/g, '')}
            dangerouslySetInnerHTML={{
              __html: textValue.replace(/\n/g, '<br />')
            }}
          ></div>
        )
      ],
      [
        'DateTime',
        (date: Date) => {
          return <div title={date.toLocaleDateString()}>{date.toLocaleDateString()}</div>
        }
      ]
    ])

    const value = props.model.getParsedValue()

    if (renderMap.has(props.model.type)) {
      return renderMap.get(props.model.type)(value)
    } else {
      return <div title={value.toString()}>{value}</div>
    }
  }

  const displayMode = props.displayMode ?? context.props.displayMode

  return { displayMode, renderValueForField }
}
