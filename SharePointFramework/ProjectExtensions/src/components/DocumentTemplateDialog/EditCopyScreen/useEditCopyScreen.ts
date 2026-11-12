import { useCallback, useContext } from 'react'
import { DocumentTemplateDialogContext } from '../context'
import { TEMPLATE_CHANGED } from '../reducer'

/** Connects template-copy edits to dialog state and its validation-dependent footer. */
export function useEditCopyScreen() {
  const { state, dispatch } = useContext(DocumentTemplateDialogContext)
  const onInputChanged = useCallback(
    (id: string, properties: Record<string, string>, errorMessage?: string) => {
      dispatch(TEMPLATE_CHANGED({ id, properties, errorMessage }))
    },
    [dispatch]
  )
  return { templates: state.selected, onInputChanged }
}
