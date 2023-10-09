import { DisplayMode } from '@microsoft/sp-core-library'
import { useMemo } from 'react'
import { IEditPropertiesPanelProps } from './types'

/**
 * Hook for the `EditPropertiesPanel` fields.
 *
 * @param props - The `EditPropertiesPanel` props.
 *
 * @returns Fields to be used in the `EditPropertiesPanel`.
 */
export function useEditableFields(props: IEditPropertiesPanelProps) {
  return useMemo(
    () =>
      props.fields.filter(
        (p) => p.isVisible(DisplayMode.Edit) && !props.hiddenFields.includes(p.internalName)
      ),
    [props.fields]
  )
}
