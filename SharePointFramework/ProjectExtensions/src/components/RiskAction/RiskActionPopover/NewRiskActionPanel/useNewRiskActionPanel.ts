import { useAnnounce } from '@fluentui/react-components'
import { IPersonaItem, format } from 'pp365-shared-library'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import strings from 'ProjectExtensionsStrings'
import { useCallback, useEffect, useState } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../../../extensions/riskAction/context'
import { useRiskActionContext } from '../../context'
import { INewRiskActionForm, INewRiskActionPanelProps } from './types'

const EMPTY_FORM: INewRiskActionForm = {
  title: '',
  description: '',
  responsible: [],
  createMultiple: false
}

/**
 * The task the data adapter adds, from the form: the responsible by email, which `addTask`
 * resolves to a Planner user, and the days as the picker gave them.
 */
function toTaskModel(form: INewRiskActionForm): Map<string, any> {
  return new Map<string, any>([
    ['title', form.title],
    ['description', form.description],
    ['startDate', form.startDate],
    ['dueDate', form.dueDate],
    ['responsible', form.responsible[0]?.secondaryText]
  ])
}

/**
 * Manages new-task form fields, people search and saving, including consecutive task creation.
 * Usage statistics count each task that was added, and a save that failed by its error's code.
 */
export function useNewRiskActionPanel(props: INewRiskActionPanelProps) {
  const context = useRiskActionFieldCustomizerContext()
  const { itemContext, setItemContext } = useRiskActionContext()
  const [form, setForm] = useState<INewRiskActionForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const { announce } = useAnnounce()
  const telemetry = useTelemetry()

  // The panel stays mounted while closed; a new opening must not show the previous save error.
  useEffect(() => {
    if (props.open) setSaveError(undefined)
  }, [props.open])

  const setField = useCallback(
    <K extends keyof INewRiskActionForm>(key: K, value: INewRiskActionForm[K]) => {
      setForm((current) => ({ ...current, [key]: value }))
    },
    []
  )

  const resolvePeople = useCallback(
    (filter: string, selected: IPersonaItem[]) =>
      context.dataAdapter.clientPeoplePickerSearchUser(filter, selected),
    [context.dataAdapter]
  )

  const onSave = useCallback(async (): Promise<void> => {
    setIsSaving(true)
    setSaveError(undefined)
    try {
      const task = await context.dataAdapter.addTask(toTaskModel(form), itemContext)
      setItemContext(await context.dataAdapter.updateItem([task], itemContext))
    } catch (error) {
      telemetry.trackError(error)
      setSaveError(error?.message ?? '')
      return
    } finally {
      setIsSaving(false)
    }
    telemetry.track('riskAction.created')
    // Said either way: with «create several» the panel stays, its form cleared in silence.
    announce(format(strings.NewRiskActionSaved, form.title), { polite: true })
    if (form.createMultiple) {
      setForm({ ...EMPTY_FORM, createMultiple: true })
    } else {
      setForm(EMPTY_FORM)
      props.onClose?.()
    }
  }, [announce, context.dataAdapter, form, itemContext, props.onClose, setItemContext, telemetry])

  return {
    headerText: format(strings.NewRiskActionPanelTitle, context.itemContext.title),
    form,
    setField,
    resolvePeople,
    onSave,
    isSaving,
    saveError,
    canSave: form.title.trim().length > 0 && !isSaving,
    // What «Lagre» waits for, in its description while it cannot be used (WCAG 3.3.2).
    saveDisabledReason:
      form.title.trim().length > 0 ? undefined : strings.NewRiskActionSaveNeedsTitle
  }
}
