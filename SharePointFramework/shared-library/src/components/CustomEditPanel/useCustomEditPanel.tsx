import { useState } from 'react'
import { useFieldElements } from './CustomEditPanelBody/FieldElements/useFieldElements'
import { ICustomEditPanelContext } from './context'
import { ICustomEditPanelProps } from './types'
import { useEditableFields } from './useEditableFields'
import { useModel } from './useModel'

/**
 * Hook for `CustomEditPanel` component. Generates fields and field elements
 * using hooks and provides them to the component. Also handles submitting the
 * form and syncing the property list fields.
 *
 * @returns The following properties:
 * - `fields` - the fields to render
 * - `getFieldElement` - a function that returns the field element for a given field
 * - `model` - the model for the form
 */
export function useCustomEditPanel(props: ICustomEditPanelProps) {
  const fields = useEditableFields(props)
  const model = useModel(props)
  const getFieldElement = useFieldElements()
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map())

  /**
   * Set a validation error for a field.
   */
  const setValidationError = (fieldInternalName: string, error: string) => {
    setValidationErrors(new Map(validationErrors.set(fieldInternalName, error)))
  }

  /**
   * Clear a validation error for a field.
   */
  const clearValidationError = (fieldInternalName: string) => {
    validationErrors.delete(fieldInternalName)
    setValidationErrors(new Map(validationErrors))
  }

  /**
   * Save is disabled if required columns are missing values or if there are validation errors.
   */
  const isSaveDisabled = (): boolean => {
    const requiredFields = fields.filter((field) => field.required)
    const hasRequiredFieldsEmpty = requiredFields.some((field) => !model.get(field))
    const hasValidationErrors = validationErrors.size > 0
    return hasRequiredFieldsEmpty || hasValidationErrors
  }

  return {
    fields,
    getFieldElement,
    model,
    isSaveDisabled,
    props,
    validationErrors,
    setValidationError,
    clearValidationError
  } as ICustomEditPanelContext
}
