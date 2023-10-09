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
  return useMemo(
    () =>
      props.fields.filter(
        (p) => p.isVisible(DisplayMode.Edit) && !props.hiddenFields.includes(p.internalName)
      ),
    [props.fields]
  )
}
