import { IPersonaProps, ITag, Link } from '@fluentui/react'
import React from 'react'
import { IIdeaFieldProps } from './types'
import { Persona } from '@fluentui/react-components'
import { OverflowTagMenu } from 'pp365-shared-library'
import {
  ChevronCircleRightFilled,
  EarthFilled,
  GlobeLocationFilled,
  TagFilled,
  TagMultipleFilled
} from '@fluentui/react-icons'

/**
 * Component logic hook for the `IdeaField` component.
 *
 * @param props Props for the `IdeaField` component
 *
 * @returns a render function `renderValueForField` for the `IdeaField` component,
 * as well as the `displayMode` for the `IdeaField` component.
 */
export function useIdeaField(props: IIdeaFieldProps) {
  /**
   * Renders the value for the field based on the field type.
   *
   * @returns JSX.Element
   */
  const renderValueForField = () => {
    let icon = TagMultipleFilled

    if (props.model.internalName === 'GtIdeaRecommendation') {
      props.model.type = 'TaxonomyFieldType'
    }

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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
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
          <div style={{ marginTop: 6 }}>
            <OverflowTagMenu
              text={props.model.displayName}
              tags={tags.map((tag) => tag && tag.name)}
              icon={icon}
            />
          </div>
        )
      ],
      [
        'TaxonomyFieldType',
        ([tag]: ITag[]) => (
          <div style={{ marginTop: 6 }}>
            <OverflowTagMenu text={props.model.displayName} tags={[tag.name]} icon={icon} />
          </div>
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

  return { renderValueForField }
}
