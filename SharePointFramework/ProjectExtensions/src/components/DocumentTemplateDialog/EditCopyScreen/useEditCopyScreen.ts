import { useCallback, useContext } from 'react'
import { DocumentTemplateDialogContext } from '../context'
import { TEMPLATE_CHANGED } from '../reducer'

/**
 * Component logic hook for `EditCopyScreen`: the copies to name, and their edits, which go to the
 * dialog's state so its footer knows whether every name is valid.
 */
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
