/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useId } from '@fluentui/react-components'
import { stringIsNullOrEmpty } from '@pnp/core'
import { useCallback, useContext, useState } from 'react'
import { useBoolean } from 'usehooks-ts'
import { IRiskActionProps } from '../types'
import { RiskActionFieldCustomizerContext } from '../../../context'

/**
 * Custom hook for the `NewRiskActionPanel` component.
 *
 * @param props - The `IRiskActionProps` object containing the data adapter and other props.
 *
 * @returns An object containing the title, description, onSave function, and tooltipContent for the component.
 */
export function useNewRiskActionPanel(props: IRiskActionProps) {
  const context = useContext(RiskActionFieldCustomizerContext)
  const panelState = useBoolean(false)
  const [isSaving, setIsSaving] = useState(false)
  const [model, $setModel] = useState(new Map<string, any>())

  const setModel = useCallback((key: string, value: any) => {
    $setModel((_model) => {
      const newModel = new Map(_model)
      newModel.set(key, value)
      return newModel
    })
  }, [props.itemContext, model])

  /**
   * On save callback
   */
  const onSave = useCallback(async () => {
    setIsSaving(true)
    const task = await context.dataAdapter.addTask('title', 'description', props)
    await context.dataAdapter.updateItem(task, props)
    panelState.setFalse()
    setIsSaving(false)
  }, [props.itemContext])

  let tooltipContent = 'Legg til nytt tiltak som oppgave i Planner.'

  if (stringIsNullOrEmpty(props.itemContext.hiddenFieldValue)) {
    tooltipContent =
      'Legg til nytt tiltak som oppgave i Planner. Verdien i feltet vil bli erstattet med tittel på tiltakene som lagres i Planner.'
  }

  const fluentProviderId = useId('risk-action-panel-fluent-provider')

  console.log(model)

  return {
    model,
    setModel,
    onSave,
    tooltipContent,
    isSaving,
    openPanel: panelState.setTrue,
    closePanel: panelState.setFalse,
    isPanelOpen: panelState.value,
    fluentProviderId
  }
}
