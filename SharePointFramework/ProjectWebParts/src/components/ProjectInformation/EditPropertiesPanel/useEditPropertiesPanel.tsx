import { useModel } from './useModel'
import { useFields } from './useFields'
import { useFieldElements } from './useFieldElements'
import { useSubmit } from './useSubmit'
import { useProjectInformationContext } from '../context'
import { usePropertiesSync } from '../usePropertiesSync'
import { useEffect } from 'react'
import _ from 'lodash'
import { PROPERTIES_UPDATED } from '../reducer'

/**
 * Hook for `EditPropertiesPanel` component. Generates fields and field elements
 * using hooks and provides them to the component. Also handles submitting the
 * form and syncing the property list fields.
 *
 * @returns `fields` and `getFieldElement` properties
 */
export function useEditPropertiesPanel() {
  const context = useProjectInformationContext()
  const fields = useFields()
  const model = useModel()
  const getFieldElement = useFieldElements(model)
  const { onSave } = useSubmit(model)
  const { syncList } = usePropertiesSync(context)
  const isOpen = context.state.activePanel === 'EditPropertiesPanel'

  useEffect(() => {
    if (!isOpen) return
    syncList().then(({ fieldsAdded }) => {
      if (!_.isEmpty(fieldsAdded)) {
        context.dispatch(PROPERTIES_UPDATED({ refetch: false, newFields: fieldsAdded }))
      }
    })
  }, [isOpen])

  return { fields, getFieldElement, model, onSave, isOpen } as const
}
