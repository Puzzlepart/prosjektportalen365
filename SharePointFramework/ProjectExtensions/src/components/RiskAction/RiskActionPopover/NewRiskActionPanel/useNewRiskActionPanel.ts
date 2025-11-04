import { IPanelProps } from '@fluentui/react'
import { useId } from '@fluentui/react-components'
import { useCallback, useState } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../../../extensions/riskAction/context'
import { useRiskActionContext } from '../../context'

/**
 * A custom React hook that provides state and functions for the NewRiskActionPanel component.
 *
 * @param props - The props for the NewRiskActionPanel component.
 *
 * @returns An object containing the model, setModel function, onSave function, isSaving boolean, and fluentProviderId string.
 */
export function useNewRiskActionPanel(props: IPanelProps) {
  const context = useRiskActionFieldCustomizerContext()
  const { itemContext, setItemContext } = useRiskActionContext()
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
   * Resets the model by setting it to a new empty Map.
   */
  const resetModel = useCallback(() => {
    $setModel(new Map<string, any>())
  }, [])

  /**
   * Saves the new risk action to the data adapter and updates the item. If the
   * `createMultiple` property is set to `true`, the panel will remain open. Otherwise,
   * the panel will close after the save operation is complete and the model
   * will be reset.
   *
   * @returns A Promise that resolves when the save operation is complete.
   */
  const onSave = useCallback(async (): Promise<void> => {
    const createMultiple = model.get('createMultiple') as boolean
    setIsSaving(true)
    const task = await context.dataAdapter.addTask(model, itemContext)
    const updatedItemContext = await context.dataAdapter.updateItem([task], itemContext)
    setItemContext(updatedItemContext)
    setIsSaving(false)
    if (!createMultiple) {
      resetModel()
      props.onDismiss()
    }
  }, [itemContext, model])

  const fluentProviderId = useId('fp-risk-action-panel')

  return {
    model,
    setModel,
    onSave,
    isSaving,
    fluentProviderId
  }
}
