import { IPersonaProps, Link } from '@fluentui/react'
import React from 'react'
import { useProjectInformationContext } from '../../context'
import { IProjectPropertyProps } from './types'
import { Persona, Text } from '@fluentui/react-components'
import { OverflowTagMenu } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import {
  ChevronCircleRightFilled,
  EarthFilled,
  GlobeLocationFilled,
  TagFilled,
  TagMultipleFilled
} from '@fluentui/react-icons'

/**
 * Component logic hook for the `ProjectProperty` component.
 *
 * @param props Props for the `ProjectProperty` component
 *
 * @returns a render function `renderValueForField` for the `ProjectProperty` component,
 * as well as the `displayMode` for the `ProjectProperty` component.
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

    if (props.model.internalName === 'GtProjectPhase') {
      const phaseText = context.state.data.fieldValues?.get<string>('GtProjectPhaseText', {
        format: 'text',
        defaultValue: ''
      })

      if (phaseText) {
        return (
          <div style={{ marginTop: 6 }}>
            <OverflowTagMenu
              text={props.model.displayName}
              tags={[phaseText]}
              icon={ChevronCircleRightFilled}
            />
          </div>
        )
      }
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
        (tags: any[]) => {
          const tagNames = tags
            ?.filter(Boolean)
            .map((tag) => {
              if (tag && typeof tag === 'object') {
                if ('labels' in tag && Array.isArray(tag.labels) && tag.labels.length > 0) {
                  return tag.labels[0]?.name
                }
                if ('name' in tag) {
                  return tag.name
                }
              }
              return null
            })
            .filter(Boolean)
          return (
            <div style={{ marginTop: 6 }}>
              <OverflowTagMenu text={props.model.displayName} tags={tagNames} icon={icon} />
            </div>
          )
        }
      ],
      [
        'TaxonomyFieldType',
        ([tag]: any[]) => {
          let name: string | undefined
          if (tag && typeof tag === 'object') {
            if ('labels' in tag && Array.isArray(tag.labels) && tag.labels.length > 0) {
              name = tag.labels[0]?.name
            } else if ('name' in tag) {
              name = tag.name
            }
          }
          return (
            <div style={{ marginTop: 6 }}>
              <OverflowTagMenu
                text={props.model.displayName}
                tags={name ? [name] : []}
                icon={icon}
              />
            </div>
          )
        }
      ],
      [
        'URL',
        ({ url, description }) => {
          if (!url) return null
          return (
            <div>
              <Link href={url} target='_blank' rel='noopener noreferrer' title={description}>
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

    try {
      const value = props.model.getParsedValue()

      if (value === null || value === undefined) {
        return (
          <Text
            italic
            size={200}
            style={{ color: 'var(--colorNeutralForeground4)', marginTop: 6 }}
          >
            {strings.PropertyValueRenderError}
          </Text>
        )
      }

      if (renderMap.has(props.model.type)) {
        return renderMap.get(props.model.type)(value)
      } else {
        return <div title={value.toString()}>{value}</div>
      }
    } catch (error) {
      console.warn(
        `[ProjectProperty] Failed to render value for field '${props.model.internalName}':`,
        error
      )
      return (
        <Text
          italic
          size={200}
          style={{ color: 'var(--colorNeutralForeground4)', marginTop: 6 }}
        >
          {strings.PropertyValueRenderError}
        </Text>
      )
    }
  }

  const displayMode = props.displayMode ?? context.props.displayMode

  return { displayMode, renderValueForField }
}
