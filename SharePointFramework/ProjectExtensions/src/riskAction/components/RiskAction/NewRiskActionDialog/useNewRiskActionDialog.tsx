/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { stringIsNullOrEmpty } from '@pnp/core'
import { useState } from 'react'
import { IRiskActionProps } from '../types'

/**
 * Custom hook for the `NewRiskActionDialog` component.
 *
 * @param props - The `IRiskActionProps` object containing the data adapter and other props.
 *
 * @returns An object containing the title, description, onSave function, and tooltipContent for the component.
 */
export function useNewRiskActionDialog(props: IRiskActionProps) {
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  /**
   * On save callback
   */
  async function onSave() {
    setIsSaving(true)
    const task = await props.dataAdapter.addTask(title, description, props)
    await props.dataAdapter.updateItem(task, props)
    setOpen(false)
    setIsSaving(false)
  }

  let tooltipContent = 'Legg til nytt tiltak som oppgave i Planner.'

  if (stringIsNullOrEmpty(props.itemContext.hiddenFieldValue)) {
    tooltipContent =
      'Legg til nytt tiltak som oppgave i Planner. Verdien i feltet vil bli erstattet med tittel på tiltakene som lagres i Planner.'
  }

  return {
    title,
    setTitle,
    description,
    setDescription,
    onSave,
    tooltipContent,
    open,
    setOpen,
    isSaving
  }
}
