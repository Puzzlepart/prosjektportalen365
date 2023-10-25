import { FC } from 'react'
import { EditableSPField } from '../../../../models'

interface IFieldElementProps {
  field: EditableSPField
}

export type FieldElementComponent = FC<IFieldElementProps>
