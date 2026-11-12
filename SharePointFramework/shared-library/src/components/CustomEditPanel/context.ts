import { createContext, useContext } from 'react'
import { ICustomEditPanelProps } from './types'
import { UseModelReturnType } from './useModel'
import { EditableSPField } from '../../models'

/**
 * Shares the edit-panel model, field renderers and validation errors.
 */
export interface ICustomEditPanelContext {
  model: UseModelReturnType
  fields: EditableSPField[]
  getFieldElement: (field: EditableSPField) => JSX.Element
  isSaveDisabled: () => boolean
  props: ICustomEditPanelProps
  validationErrors: Map<string, string>
  setValidationError: (fieldInternalName: string, error: string) => void
  clearValidationError: (fieldInternalName: string) => void
}

/**
 * Shares edit-panel state with its field editors and footer.
 */
export const CustomEditPanelContext = createContext<ICustomEditPanelContext>(null)

/**
 * Reads the model and validation state of the enclosing edit panel.
 */
export const useCustomEditPanelContext = () => useContext(CustomEditPanelContext)
