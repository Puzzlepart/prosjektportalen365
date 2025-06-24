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
  const defaultType = !state.loading && !state.error && state.types[0]

  const initialColumn = new Map<string, any>([
    ['type', ''],
    ['name', ''],
    ['description', ''],
    ['justification', ''],
    ['owner', []],
    ['member', []],
    ['requestedBy', []],
    ['alias', ''],
    ['url', ''],
    ['teamify', false],
    ['teamTemplate', 'Standard'],
    ['sensitivityLabel', ''],
    ['sensitivityLabelLibrary', ''],
    ['retentionLabel', ''],
    ['expirationDate', null],
    ['readOnlyGroup', false],
    ['internalChannel', false],
    ['requestedSource', ''],
    ['image', ''],
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
      ],
      [
        'requestedBy',
        async () => {
          const values = await Promise.all(
            await props.dataAdapter.getProvisionUsers(value, props.provisionUrl)
          )
          return _.flatten(values)
        }
      ],
      [
        'image',
        () => {
          if (value) {
            return `${value.substring(0, 42)}...`
          }
          return null
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
    $setColumn(initialColumn)
  }

  /**
   * Get global setting value
   * @param setting Setting to get
   */
  const getGlobalSetting = (setting: string) => {
    return state.settings.find((t) => t.title === setting)?.value
  }

  useEffect(() => {
    $setColumn((prev) => {
      const newColumn = new Map(prev)
      newColumn.set('type', defaultType.title)

      setState({
        properties: {
          ...state.properties,
          type: defaultType.title
        }
      })
      return newColumn
    })
  }, [state.loading])

  useEffect(() => {
    if (!state.loading) {
      const typeDefaults = state.types.find((t) => t.title === state.properties.type) || defaultType
      const defaultConfidentialData = typeDefaults?.defaultConfidentialData
      const defaultSensitivityLabel =
        typeDefaults?.defaultSensitivityLabel || getGlobalSetting('DefaultSensitivityLabel')
      const defaultSensitivityLabelLibrary =
        typeDefaults?.defaultSensitivityLabelLibrary || getGlobalSetting('DefaultSensitivityLabelLibrary')
      const defaultRetentionLabel =
        typeDefaults?.defaultRetentionLabel || getGlobalSetting('DefaultRetentionLabel')
      const defaultVisibility =
        typeDefaults?.defaultVisibility === 'Public'
          ? strings.Provision.PrivacyFieldOptionPublic
          : strings.Provision.PrivacyFieldOptionPrivate
      const enableExternalSharing = getGlobalSetting('EnableExternalSharingByDefault')

      $setColumn((prev) => {
        const newColumns = new Map(prev)
        newColumns.set('isConfidential', defaultConfidentialData)
        newColumns.set('privacy', defaultVisibility)
        newColumns.set('sensitivityLabel', defaultSensitivityLabel)
        newColumns.set('sensitivityLabelLibrary', defaultSensitivityLabelLibrary)
        newColumns.set('retentionLabel', defaultRetentionLabel)
        newColumns.set('externalSharing', enableExternalSharing)

        setState({
          properties: {
            ...state.properties,
            isConfidential: defaultConfidentialData,
            sensitivityLabel: defaultSensitivityLabel,
            sensitivityLabelLibrary: defaultSensitivityLabelLibrary,
            retentionLabel: defaultRetentionLabel,
            externalSharing: enableExternalSharing
          }
        })
        return newColumns
      })
    }
  }, [state.properties.type])

  return {
    column,
    setColumn,
    reset
  } as const
}
