import { DisplayMode } from '@microsoft/sp-core-library'
import { useMemo } from 'react'
import { ICustomEditPanelProps } from './types'

/**
 * Selects fields visible in edit mode, excluding caller-hidden fields.
 */
export function useEditableFields(props: ICustomEditPanelProps) {
  return useMemo(() => {
    const editableFields = props.fields.filter((p) => {
      const isVisible = p.isVisible(DisplayMode.Edit)
      const isNotHidden = !props.hiddenFields.includes(p.internalName)

      return isVisible && isNotHidden
    })

    return editableFields
  }, [props.fields, props.hiddenFields])
}
