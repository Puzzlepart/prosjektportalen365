/* eslint-disable no-console */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { IProjectProvisionProps, IProjectProvisionState } from './types'
import _ from 'lodash'
import strings from 'PortfolioWebPartsStrings'

/**
 * Initial column with default values.
 */
export function useEditableColumn(
  props: IProjectProvisionProps,
  state: IProjectProvisionState,
  setState: (newState: Partial<IProjectProvisionState>) => void
) {
  const [hubSiteTitle, setHubSiteTitle] = useState<string>(props.pageContext.web.title)

  const defaultType = useMemo(() => {
    return !state.loading && !state.error && state.types && state.types.length > 0
      ? state.types[0]
      : null
  }, [state.loading, state.error, state.types])

  // Fetch hub site title when in parent mode
  useEffect(() => {
    const fetchHubSiteTitle = async () => {
      if (props.parentMode && props.dataAdapter) {
        try {
          const hubInfo = await props.dataAdapter.portalDataService.resolveHubSiteFromUrl(
            props.dataAdapter.portalDataService.url
          )
          if (hubInfo?.title) {
            setHubSiteTitle(hubInfo.title)
          }
        } catch (error) {
          console.warn('Failed to resolve hub site title:', error)
          setHubSiteTitle(props.pageContext.web.title)
        }
      } else {
        setHubSiteTitle(props.pageContext.web.title)
      }
    }
    fetchHubSiteTitle()
  }, [props.parentMode, props.pageContext.web.absoluteUrl, props.pageContext.web.title, props.dataAdapter])

  const initialColumn = useMemo(
    () =>
      new Map<string, any>([
        ['type', ''],
        ['name', ''],
        ['description', ''],
        ['justification', ''],
        ['additionalInfo', ''],
        ['owner', []],
        ['member', []],
        ['requestedBy', []],
        ['alias', ''],
        ['url', ''],
        ['teamify', false],
        ['teamTemplate', strings.Provision.DefaultTeamTemplate],
        ['sensitivityLabel', ''],
        ['sensitivityLabelLibrary', ''],
        ['retentionLabel', ''],
        ['expirationDate', null],
        ['readOnlyGroup', false],
        ['internalChannel', false],
        ['requestedSource', ''],
        ['image', ''],
        ['isConfidential', false],
        ['metadata', ''],
        ['privacy', strings.Provision.PrivacyFieldOptionPrivate],
        ['externalSharing', false],
        ['guest', []],
        ['language', strings.Provision.DefaultLanguage],
        ['timeZone', strings.Provision.DefaultTimeZone],
        ['hubSite', props.pageContext.legacyPageContext.hubSiteId],
        ['hubSiteTitle', hubSiteTitle]
      ]),
    [props.pageContext.legacyPageContext.hubSiteId, hubSiteTitle]
  )

  const [column, $setColumn] = useState<Map<string, any>>(initialColumn)

  /**
   * Transform value for the field returning the transformed value.
   * Now includes proper error handling and type safety.
   *
   * @param value Value to be transformed
   * @param field Field to transform the value for
   *
   * @returns The transformed value
   */
  const transformValue = useCallback(
    async (value: any, field: string): Promise<any> => {
      try {
        const valueMap = new Map<string, () => Promise<any> | any>([
          [
            'teamTemplate',
            () => {
              const template = state.teamTemplates?.find((t) => t.title === value)
              return template?.templateId || ''
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
            () => {
              if (!value) return []
              return [
                {
                  Description: value,
                  Url: value
                }
              ]
            }
          ],
          [
            'owner',
            async () => {
              if (!value || !Array.isArray(value)) return []
              if (!props.dataAdapter) {
                console.warn('dataAdapter is not available')
                return []
              }
              try {
                const users = await props.dataAdapter.getProvisionUsers(value, props.provisionUrl)
                const values = await Promise.all(users)
                return _.flatten(values)
              } catch (error) {
                console.warn(`Failed to get provision users for owner: ${error}`)
                return []
              }
            }
          ],
          [
            'member',
            async () => {
              if (!value || !Array.isArray(value)) return []
              if (!props.dataAdapter) {
                console.warn('dataAdapter is not available')
                return []
              }
              try {
                const users = await props.dataAdapter.getProvisionUsers(value, props.provisionUrl)
                const values = await Promise.all(users)
                return _.flatten(values)
              } catch (error) {
                console.warn(`Failed to get provision users for member: ${error}`)
                return []
              }
            }
          ],
          [
            'requestedBy',
            async () => {
              if (!value || !Array.isArray(value)) return []
              if (!props.dataAdapter) {
                console.warn('dataAdapter is not available')
                return []
              }
              try {
                const users = await props.dataAdapter.getProvisionUsers(value, props.provisionUrl)
                const values = await Promise.all(users)
                return _.flatten(values)
              } catch (error) {
                console.warn(`Failed to get provision users for requestedBy: ${error}`)
                return []
              }
            }
          ],
          [
            'image',
            () => {
              if (value && typeof value === 'string') {
                return value.length > 42 ? `${value.substring(0, 42)}...` : value
              }
              return null
            }
          ],
          [
            'expirationDate', // TODO: support for users for english locale
            () => {
              if (props.expirationDateMode !== 'date') {
                if (value && value !== '0') {
                  const months = parseInt(value, 10)
                  if (!isNaN(months) && months > 0) {
                    const date = new Date()
                    date.setMonth(date.getMonth() + months)
                    return date.toISOString()
                  }
                }
                return null
              }
              return value
            }
          ]
        ])

        if (valueMap.has(field)) {
          return await valueMap.get(field)!()
        }
        return value
      } catch (error) {
        console.error(`Error transforming value for field '${field}':`, error)
        return value
      }
    },
    [state.teamTemplates, props.dataAdapter, props.provisionUrl, props.expirationDateMode]
  )

  /**
   * Calculate alias from name value accounting for prefix/suffix lengths
   */
  const calculateAlias = useCallback(
    (name: string, currentType: string): string => {
      const typeConfig = state.types?.find((t) => t.title === currentType)
      const useGlobalNaming = getGlobalSetting('UseNamingConventions') === 'true'
      const namingConvention = useGlobalNaming
        ? state.settings?.find((t) => t.title === 'NamingConvention')?.value
        : typeConfig?.namingConvention

      const prefixLength = namingConvention?.prefixText?.length || 0
      const suffixLength = namingConvention?.suffixText?.length || 0
      const maxAliasLength = 64 - prefixLength - suffixLength

      const cleanedValue = name.replace(/ /g, '').replace(/[^a-z-A-Z0-9-]/g, '')
      return cleanedValue.substring(0, Math.max(1, maxAliasLength))
    },
    [state.types, state.settings]
  )

  /**
   * Sets a property of the column with improved error handling and race condition prevention.
   *
   * @param key Key of the column to update
   * @param value Value to update the column with
   */
  const setColumn = useCallback(
    async (key: string, value: any): Promise<void> => {
      try {
        const transformedValue = await transformValue(value, key)

        $setColumn((prev) => {
          const newColumn = new Map(prev)

          if (key === 'name' && typeof value === 'string') {
            const alias = calculateAlias(value, prev.get('type'))
            newColumn.set('alias', alias)
          }

          newColumn.set(key, value)
          return newColumn
        })

        setState({
          properties: {
            ...state.properties,
            [key]: transformedValue,
            ...(key === 'name' && typeof value === 'string'
              ? { alias: calculateAlias(value, state.properties.type) }
              : {})
          }
        })
      } catch (error) {
        console.error(`Error setting column '${key}':`, error)
        $setColumn((prev) => {
          const newColumn = new Map(prev)
          newColumn.set(key, value)
          return newColumn
        })
      }
    },
    [transformValue, setState, state.properties, calculateAlias]
  )

  /**
   * Reset the properties to initial values and trigger re-initialization.
   */
  const reset = useCallback(() => {
    $setColumn(new Map(initialColumn))

    setState({
      properties: {},
      searchTerm: '',
      isRefetching: false,
      refetch: new Date().getTime()
    })
  }, [initialColumn, setState])

  /**
   * Get global setting value with improved type safety.
   * @param setting Setting to get
   */
  const getGlobalSetting = useCallback(
    (setting: string): string | undefined => {
      return state.settings?.find((t) => t.title === setting)?.value
    },
    [state.settings]
  )

  // Set default type when data loads
  useEffect(() => {
    if (defaultType && !state.properties.type) {
      try {
        $setColumn((prev) => {
          const newColumn = new Map(prev)
          newColumn.set('type', defaultType.title)
          newColumn.set('hubSiteTitle', hubSiteTitle)
          return newColumn
        })

        setState({
          properties: {
            ...state.properties,
            type: defaultType.title,
            hubSiteTitle: hubSiteTitle
          }
        })
      } catch (error) {
        console.error('Error setting default type:', error)
      }
    }
  }, [state.loading, defaultType])

  // Set defaults based on selected type
  useEffect(() => {
    const setDefaults = async () => {
      if (state.loading || !state.types || state.types.length === 0 || !defaultType) {
        return
      }

      try {
        const typeDefaults =
          state.types.find((t) => t.title === state.properties.type) || defaultType
        const defaultConfidentialData = typeDefaults?.defaultConfidentialData ?? false
        const defaultSensitivityLabel =
          typeDefaults?.defaultSensitivityLabel || getGlobalSetting('DefaultSensitivityLabel') || ''
        const defaultSensitivityLabelLibrary =
          typeDefaults?.defaultSensitivityLabelLibrary ||
          getGlobalSetting('DefaultSensitivityLabelLibrary') ||
          ''
        const defaultRetentionLabel =
          typeDefaults?.defaultRetentionLabel || getGlobalSetting('DefaultRetentionLabel') || ''
        const defaultVisibility =
          typeDefaults?.defaultVisibility === 'Public'
            ? strings.Provision.PrivacyFieldOptionPublic
            : strings.Provision.PrivacyFieldOptionPrivate
        const enableExternalSharing = getGlobalSetting('EnableExternalSharingByDefault') === 'true'
        const defaultTeamify = typeDefaults?.teamify ?? false

        const defaultExpirationDate =
          props.expirationDateMode === 'monthDropdown' ? props.defaultExpirationDate || '0' : null

        const defaultMetadata = typeDefaults?.defaultMetadata || ''

        let defaultOwner: any[] = []
        let transformedOwner: any[] = []
        let transformedExpirationDate: any = null

        if (props.autoOwner) {
          const { displayName, loginName } = props.pageContext.user
          defaultOwner = [
            {
              text: displayName,
              secondaryText: loginName
            }
          ]
          try {
            transformedOwner = await transformValue(defaultOwner, 'owner')
          } catch (error) {
            console.warn('Error transforming default owner:', error)
            transformedOwner = []
          }
        }

        if (props.defaultExpirationDate && props.expirationDateMode === 'monthDropdown') {
          transformedExpirationDate = await transformValue(defaultExpirationDate, 'expirationDate')
        }

        $setColumn((prev) => {
          const newColumns = new Map(prev)
          newColumns.set('isConfidential', defaultConfidentialData)
          newColumns.set('metadata', defaultMetadata)
          newColumns.set('privacy', defaultVisibility)
          newColumns.set('sensitivityLabel', defaultSensitivityLabel)
          newColumns.set('sensitivityLabelLibrary', defaultSensitivityLabelLibrary)
          newColumns.set('retentionLabel', defaultRetentionLabel)
          newColumns.set('externalSharing', enableExternalSharing)
          newColumns.set('teamify', defaultTeamify)
          newColumns.set('owner', defaultOwner)
          newColumns.set('expirationDate', defaultExpirationDate)
          return newColumns
        })

        setState({
          properties: {
            ...state.properties,
            isConfidential: defaultConfidentialData,
            metadata: defaultMetadata,
            sensitivityLabel: defaultSensitivityLabel,
            sensitivityLabelLibrary: defaultSensitivityLabelLibrary,
            retentionLabel: defaultRetentionLabel,
            externalSharing: enableExternalSharing,
            teamify: defaultTeamify,
            owner: transformedOwner,
            expirationDate: transformedExpirationDate
          }
        })
      } catch (error) {
        console.error('Error setting defaults:', error)
      }
    }

    setDefaults()
  }, [state.loading, state.types, state.properties.type, defaultType])

  return {
    column,
    setColumn,
    reset
  } as const
}
