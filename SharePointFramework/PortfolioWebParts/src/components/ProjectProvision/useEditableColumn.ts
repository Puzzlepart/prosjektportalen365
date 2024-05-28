import { useEffect, useState } from 'react'
import { IProjectProvisionState } from './types'

/**
 * Intial column with default values.
 */
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
  ['allowGuests', false],
  ['guest', []],
  ['language', 'Norsk (bokmål)'],
  ['timeZone', '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna'],
  ['hubSite', 'Prosjektportalen 365']
])

export function useEditableColumn(
  state: IProjectProvisionState,
  setState: (newState: Partial<IProjectProvisionState>) => void
) {
  const [column, $setColumn] = useState<Map<string, any>>(initialColumn)

  useEffect(() => {
    $setColumn(initialColumn)
  }, [])

  /**
   * Sets a property of the column.
   *
   * @param key Key of the column to update
   * @param value Value to update the column with
   */
  const setColumn = (key: string, value: any) => {
    $setColumn((prev) => {
      const newColumn = new Map(prev)
      newColumn.set(key, value)
      setState({ properties: { ...state.properties, [key]: value } })
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
