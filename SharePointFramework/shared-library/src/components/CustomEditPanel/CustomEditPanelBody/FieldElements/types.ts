import { FC } from 'react'
import { EditableSPField } from '../../../../models'

interface IFieldElementProps {
  field: EditableSPField
}

/**
 * Renders an editable SharePoint field using the edit-panel context.
 */
export type FieldElementComponent = FC<IFieldElementProps>
