import { IPersonaItem, format } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import { useCallback, useState } from 'react'
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
    try {
      const task = await context.dataAdapter.addTask(toTaskModel(form), itemContext)
      setItemContext(await context.dataAdapter.updateItem([task], itemContext))
    } finally {
      setIsSaving(false)
    }
    if (form.createMultiple) {
      setForm({ ...EMPTY_FORM, createMultiple: true })
    } else {
      setForm(EMPTY_FORM)
      props.onClose?.()
    }
  }, [context.dataAdapter, form, itemContext, props.onClose, setItemContext])

  return {
    headerText: format(strings.NewRiskActionPanelTitle, context.itemContext.title),
    form,
    setField,
    resolvePeople,
    onSave,
    isSaving,
    canSave: form.title.trim().length > 0 && !isSaving
  }
}
