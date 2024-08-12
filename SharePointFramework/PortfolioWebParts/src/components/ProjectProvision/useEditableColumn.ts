import { useEffect, useState } from 'react'
import { IProjectProvisionProps, IProjectProvisionState } from './types'
import _ from 'lodash'
import strings from 'PortfolioWebPartsStrings'

/**
 * Intial column with default values.
 */
export function useEditableColumn(
  props: IProjectProvisionProps,
  state: IProjectProvisionState,
  setState: (newState: Partial<IProjectProvisionState>) => void
) {
  const defaultType =
    !state.loading &&
    state.types
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter(
        (type) =>
          !type.visibleTo ||
          type.visibleTo?.some((user) => user?.EMail?.includes(props?.pageContext?.user?.loginName))
      )[0]

  const initialColumn = new Map<string, any>([
    ['type', 'Project'],
    ['typeTitle', 'Prosjektområde'],
    ['name', ''],
    ['description', ''],
    ['justification', ''],
    ['alias', ''],
    ['url', ''],
    ['owner', []],
    ['member', []],
    ['teamify', false],
    ['teamTemplate', 'Standard'],
    ['isConfidential', false],
    ['privacy', strings.Provision.PrivacyFieldOptionPrivate],
    ['externalSharing', false],
    ['guest', []],
    ['language', 'Norsk (bokmål)'],
    ['timeZone', '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna'],
    ['hubSite', props.pageContext.legacyPageContext.hubSiteId],
    ['hubSiteTitle', props.pageContext.web.title]
  ])

  const [column, $setColumn] = useState<Map<string, any>>(initialColumn)

  /**
   * Transform value for the field returning the transformed value.
   *
   * @param value Value to be transformed
   * @param field Field to transform the value for
   *
   * @returns The transformed value
   */
  const transformValue = async (value: any, field: string) => {
    const valueMap = new Map<string, () => Promise<any[]> | any[] | string>([
      [
        'teamTemplate',
        () => {
          const template = state.teamTemplates.find((t) => t.title === value)
          return template.templateId
        }
      ],
      [
        'privacy',
        () => {
          if (value === strings.Provision.PrivacyFieldOptionPrivate) {
            return 'Private'
          }
          return 'Public'
        }
      ],
      [
        'url',
        () => [
          {
            Description: value,
            Url: value
          }
        ]
      ],
      [
        'owner',
        async () => {
          const values = await Promise.all(
            await props.dataAdapter.getProvisionUsers(value, props.provisionUrl)
          )
          return _.flatten(values)
        }
      ],
      [
        'member',
        async () => {
          const values = await Promise.all(
            await props.dataAdapter.getProvisionUsers(value, props.provisionUrl)
          )
          return _.flatten(values)
        }
      ]
    ])
    if (valueMap.has(field)) {
      return await valueMap.get(field)()
    }
    return value
  }

  /**
   * Sets a property of the column.
   *
   * @param key Key of the column to update
   * @param value Value to update the column with
   */
  const setColumn = async (key: string, value: any) => {
    const transformedValue = await transformValue(value, key)

    if (key === 'name') {
      const alias = value.replace(/ /g, '').replace(/[^a-z-A-Z0-9-]/g, '')
      $setColumn((prev) => {
        const newColumn = new Map(prev)
        newColumn.set('alias', alias)
        return newColumn
      })
    }

    $setColumn((prev) => {
      const newColumn = new Map(prev)
      newColumn.set(key, value)
      setState({ properties: { ...state.properties, [key]: transformedValue } })
      return newColumn
    })
  }

  /**
   * Reset the properties.
   */
  const reset = () => {
    setState({ properties: {} })
  }

  useEffect(() => {
    $setColumn((prev) => {
      const newColumn = new Map(prev)
      newColumn.set('type', defaultType.type)
      newColumn.set('typeTitle', defaultType.title)

      setState({
        properties: {
          ...state.properties,
          type: defaultType.type
        }
      })
      return newColumn
    })
  }, [state.loading])

  useEffect(() => {
    const defaultConfidentialData =
      !state.loading &&
      state.types.find((t) => t.type === state.properties.type || defaultType.type)
        ?.defaultConfidentialData

    const defaultVisibility =
      !state.loading &&
      state.types.find((t) => t.type === state.properties.type || defaultType.type)
        ?.defaultVisibility === 'Public'
        ? strings.Provision.PrivacyFieldOptionPublic
        : strings.Provision.PrivacyFieldOptionPrivate

    $setColumn((prev) => {
      const newColumns = new Map(prev)
      newColumns.set('isConfidential', defaultConfidentialData)
      newColumns.set('privacy', defaultVisibility)

      setState({
        properties: {
          ...state.properties,
          isConfidential: defaultConfidentialData,
          privacy: defaultVisibility
        }
      })
      return newColumns
    })
  }, [state.properties.type])

  return {
    column,
    setColumn,
    reset
  } as const
}
