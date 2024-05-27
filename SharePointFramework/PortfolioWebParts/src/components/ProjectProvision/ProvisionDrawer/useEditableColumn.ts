import { useEffect, useState } from 'react'
import { useProjectProvisionContext } from '../context'

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
  ['owner', ''],
  ['member', ''],

])

export function useEditableColumn() {
  const context = useProjectProvisionContext()
  const [column, $setColumn] = useState<Map<string, any>>(initialColumn)


  useEffect(() => {
      $setColumn(initialColumn)
  }, [context.state.showProvisionDrawer])

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
      context.setState({ properties: { ...context.state.properties, [key]: value } })
      return newColumn
    })
  }

  return {
    column,
    setColumn
  } as const
}
