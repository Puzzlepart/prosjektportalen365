import { useId } from '@fluentui/react-components'
import { useCallback, useState } from 'react'
import { useBoolean } from 'usehooks-ts'
import { useRiskActionFieldCustomizerContext } from '../../../../context'

/**
 * A custom React hook that provides state and functions for the NewRiskActionPanel component.
 *
 * @returns An object containing the model, setModel function, onSave function, isSaving boolean, and fluentProviderId string.
 */
export function useNewRiskActionPanel() {
  const context = useRiskActionFieldCustomizerContext()
  const panelState = useBoolean(false)
  const [isSaving, setIsSaving] = useState(false)
  const [model, $setModel] = useState(new Map<string, any>())

  /**
   * Sets a new value for a given key in the model state.
   *
   * @param key - The key to update in the model state.
   * @param value - The new value to set for the given key.
   */
  const setModel = useCallback(
    (key: string, value: any) => {
      $setModel((_model) => {
        const newModel = new Map(_model)
        newModel.set(key, value)
        return newModel
      })
    },
    [context.itemContext, model]
  )

  /**
   * Saves the new risk action to the data adapter and updates the item.
   *
   * @returns A Promise that resolves when the save operation is complete.
   */
  const onSave = useCallback(async (): Promise<void> => {
    setIsSaving(true)
    const task = await context.dataAdapter.addTask(model, context)
    await context.dataAdapter.updateItem(task, context)
    panelState.setFalse()
    setIsSaving(false)
  }, [context.itemContext, model])

  const fluentProviderId = useId('risk-action-panel-fluent-provider')

  return {
    model,
    setModel,
    onSave,
    isSaving,
    fluentProviderId
  }
}
