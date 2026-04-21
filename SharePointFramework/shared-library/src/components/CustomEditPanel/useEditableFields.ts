import { DisplayMode } from '@microsoft/sp-core-library'
import { useMemo } from 'react'
import { ICustomEditPanelProps } from './types'

/**
 * Hook for the `CustomEditPanel` fields.
 *
 * @param props - The `CustomEditPanel` props.
 *
 * @returns Fields to be used in the `CustomEditPanel`.
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
