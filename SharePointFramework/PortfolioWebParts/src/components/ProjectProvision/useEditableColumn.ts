import { useEffect, useState } from 'react'
import { IProjectProvisionProps, IProjectProvisionState } from './types'
import { IPersonaProps } from '@fluentui/react'
import _ from 'lodash'

/**
 * Intial column with default values.
 */

export function useEditableColumn(
  props: IProjectProvisionProps,
  state: IProjectProvisionState,
  setState: (newState: Partial<IProjectProvisionState>) => void
) {
  const initialColumn = new Map<string, any>([
    ['type', 'project'],
    ['name', ''],
    ['description', ''],
    ['justification', ''],
    ['alias', ''],
    ['url', ''],
    ['owner', []],
    ['member', []],
    ['isConfidential', false],
    ['privacy', 'Privat - Brukere trenger tillatelse for å bli med'],
    ['externalSharing', false],
    ['guest', []],
    ['language', 'Norsk (bokmål)'],
    ['timeZone', '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna'],
    ['hubSite', props.pageContext.legacyPageContext.hubSiteId],
    ['hubSiteTitle', props.pageContext.web.title]
  ])

  const [column, $setColumn] = useState<Map<string, any>>(initialColumn)

  useEffect(() => {
    $setColumn(initialColumn)
  }, [])

  /**
   * Transform value for the field returning the internal name of the field and the transformed value.
   *
   * @param value Value to be transformed
   * @param field Field to transform the value for
   *
   * @returns The transformed value and the internal name of the field (might be different from the field's internal name)
   */
  const transformValue = async (value: any, field: string) => {
    const valueMap = new Map<string, () => Promise<any[]> | any[] | string>([
      [
        'privacy',
        () => {
          if (value === 'Privat - Brukere trenger tillatelse for å bli med') {
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
            value.map(
              async (val: IPersonaProps) =>
                (
                  await props.dataAdapter.sp.web.ensureUser(val.secondaryText)
                ).data.Id
            )
          )
          return _.flatten(values)
        }
      ],
      [
        'member',
        async () => {
          const values = await Promise.all(
            value.map(
              async (val: IPersonaProps) =>
                (
                  await props.dataAdapter.sp.web.ensureUser(val.secondaryText)
                ).data.Id
            )
          )
          return [_.flatten(values)]
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

    $setColumn((prev) => {
      const newColumn = new Map(prev)
      newColumn.set(key, value)
      setState({ properties: { ...state.properties, [key]: transformedValue } })
      return newColumn
    })
  }

  /**
   * Reset the model and properties.
   */
  const reset = () => {
    setState({ properties: {} })
  }

  return {
    column,
    setColumn,
    reset
  } as const
}
