import { IPersonaProps, ITag, Link } from '@fluentui/react'
import React from 'react'
import { IIdeaFieldProps } from './types'
import { Persona, Tag } from '@fluentui/react-components'
import { getFluentIcon, OverflowTagMenu } from 'pp365-shared-library'
import {
  ChevronCircleRightFilled,
  EarthFilled,
  GlobeLocationFilled,
  TagFilled,
  TagMultipleFilled
} from '@fluentui/react-icons'
import { useIdeaModuleContext } from '../context'

/**
 * Component logic hook for the `IdeaField` component.
 *
 * @param props Props for the `IdeaField` component
 *
 * @returns a render function `renderValueForField` for the `IdeaField` component,
 * as well as the `displayMode` for the `IdeaField` component.
 */
export function useIdeaField(props: IIdeaFieldProps) {
  const context = useIdeaModuleContext()

  const renderValueForField = () => {
    let icon = TagMultipleFilled

    if (
      props.model.internalName === 'GtIdeaRecommendation' ||
      props.model.internalName === 'GtIdeaDecision'
    ) {
      props.model.type = 'IdeaStatus'
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
          if (user) {
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
          } else {
            return null
          }
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
      ],
      [
        'IdeaStatus',
        (textValue: string) => {
          const processing = context.state.configuration.processing
          const registration = context.state.configuration.registration

          const approveValue = [
            processing.find((p) => p.key === 'approve')?.recommendation,
            registration.find((p) => p.key === 'approve')?.recommendation
          ]
          const considerationValue = [
            processing.find((p) => p.key === 'consideration')?.recommendation,
            registration.find((p) => p.key === 'consideration')?.recommendation
          ]
          const rejectValue = [
            processing.find((p) => p.key === 'reject')?.recommendation,
            registration.find((p) => p.key === 'reject')?.recommendation
          ]

          const statusStyles = {
            approve: {
              backgroundColor: 'var(--colorPaletteLightGreenBackground2)',
              icon: getFluentIcon('CheckmarkCircle')
            },
            consideration: {
              backgroundColor: 'var(--colorPaletteYellowBackground2)',
              icon: getFluentIcon('Edit')
            },
            reject: {
              backgroundColor: 'var(--colorPaletteRedBackground2)',
              icon: getFluentIcon('DismissCircle')
            }
          }

          const statusKey = ['approve', 'consideration', 'reject'].find(
            (key) =>
              approveValue.includes(textValue) ||
              considerationValue.includes(textValue) ||
              rejectValue.includes(textValue)
          )

          const { backgroundColor, icon } = statusStyles[statusKey] || {
            backgroundColor: 'var(--colorNeutralBackground2)',
            icon: null
          }

          return (
            <div style={{ marginTop: 6 }}>
              <Tag
                style={{ backgroundColor, color: '#000' }}
                appearance='brand'
                icon={icon}
                size='medium'
              >
                {textValue}
              </Tag>
            </div>
          )
        }
      ]
    ])

    const value = props.model.getParsedValue()

    if (value) {
      if (renderMap.has(props.model.type)) {
        return renderMap.get(props.model.type)(value)
      } else {
        return <div title={value.toString()}>{value}</div>
      }
    } else {
      return null
    }
  }

  return { renderValueForField }
}
