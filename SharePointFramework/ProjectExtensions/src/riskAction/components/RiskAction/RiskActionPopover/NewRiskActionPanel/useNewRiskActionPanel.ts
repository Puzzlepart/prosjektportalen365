import { useId } from '@fluentui/react-components'
import { stringIsNullOrEmpty } from '@pnp/core/util'
import strings from 'ProjectExtensionsStrings'
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

  const setModel = useCallback((key: string, value: any) => {
    $setModel((_model) => {
      const newModel = new Map(_model)
      newModel.set(key, value)
      return newModel
    })
  }, [context.itemContext, model])


  /**
   * Saves the new risk action to the data adapter and updates the item.
   *
   * @returns A Promise that resolves when the save operation is complete.
   */
  const onSave = useCallback(async (): Promise<void> => {
    setIsSaving(true)
    const task = await context.dataAdapter.addTask(model, context)
    console.log(task)
    await context.dataAdapter.updateItem(task, context)
    panelState.setFalse()
    setIsSaving(false)
  }, [context.itemContext, model])

  const updateTasks = () => {
  }

  let infoText = strings.NewRiskActionPanelInfoText

  if (stringIsNullOrEmpty(context.itemContext.hiddenFieldValue)) {
    infoText = strings.NewRiskActionPanelInfoTextNoPlanner
  }

  const fluentProviderId = useId('risk-action-panel-fluent-provider')

  return {
    model,
    setModel,
    onSave,
    isSaving,
    fluentProviderId
  }
}
