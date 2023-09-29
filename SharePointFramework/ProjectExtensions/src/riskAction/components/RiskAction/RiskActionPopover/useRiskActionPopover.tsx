/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useId } from '@fluentui/react-components'
import { stringIsNullOrEmpty } from '@pnp/core'
import { useCallback, useContext, useState } from 'react'
import { useBoolean } from 'usehooks-ts'
import { IRiskActionProps } from '../types'
import { RiskActionFieldCustomizerContext } from '../../../context'
import strings from 'ProjectExtensionsStrings'

/**
 * Custom hook for the `RiskActionPopover` component.
 *
 * @returns An object containing the title, description, onSave function, and tooltipContent for the component.
 */
export function useRiskActionPopover() {
  const context = useContext(RiskActionFieldCustomizerContext)
  const panelState = useBoolean(false)

  const updateTasks = () => {
  }

  let infoText = strings.NewRiskActionPanelInfoText
  if (stringIsNullOrEmpty(context.itemContext.hiddenFieldValue)) {
    infoText = strings.NewRiskActionPanelInfoTextNoPlanner
  }

  return {
    updateTasks,
    openPanel: panelState.setTrue,
    closePanel: panelState.setFalse,
    isPanelOpen: panelState.value,
    infoText
  }
}
