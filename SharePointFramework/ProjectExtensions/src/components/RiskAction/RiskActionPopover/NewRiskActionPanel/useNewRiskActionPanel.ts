import { useAnnounce } from '@fluentui/react-components'
import { IPersonaItem, format } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import { useCallback, useEffect, useState } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../../../extensions/riskAction/context'
import { useRiskActionContext } from '../../context'
import { INewRiskActionForm, INewRiskActionPanelProps } from './types'

/**
 * The form before anything is typed.
 */
const EMPTY_FORM: INewRiskActionForm = {
  title: '',
  description: '',
  responsible: [],
  createMultiple: false
}

/**
 * The task the data adapter adds, from the form: the responsible by email, which `addTask`
 * resolves to a Planner user, and the days as the picker gave them.
 *
 * @param form The form
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
 * Component logic hook for `NewRiskActionPanel`: the form, the people search for the responsible,
 * and the save, which adds the task to Planner and to the risk, then closes the panel, or, with
 * «create several» on, clears the form for the next task.
 *
 * @param props The panel's props
 */
export function useNewRiskActionPanel(props: INewRiskActionPanelProps) {
  const context = useRiskActionFieldCustomizerContext()
  const { itemContext, setItemContext } = useRiskActionContext()
  const [form, setForm] = useState<INewRiskActionForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const { announce } = useAnnounce()

  // A failed save is told while the panel is open. The panel stays mounted while closed, so the
  // error is let go of as it opens again, and the opening starts clean.
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
      // The panel stays open with the form as typed, and says why (WCAG 3.3.1).
      setSaveError(error?.message ?? '')
      return
    } finally {
      setIsSaving(false)
    }
    // Said either way: with «create several» the panel stays, its form cleared in silence.
    announce(format(strings.NewRiskActionSaved, form.title), { polite: true })
    if (form.createMultiple) {
      setForm({ ...EMPTY_FORM, createMultiple: true })
    } else {
      setForm(EMPTY_FORM)
      props.onClose?.()
    }
  }, [announce, context.dataAdapter, form, itemContext, props.onClose, setItemContext])

  return {
    headerText: format(strings.NewRiskActionPanelTitle, context.itemContext.title),
    form,
    setField,
    resolvePeople,
    onSave,
    isSaving,
    saveError,
    canSave: form.title.trim().length > 0 && !isSaving
  }
}
