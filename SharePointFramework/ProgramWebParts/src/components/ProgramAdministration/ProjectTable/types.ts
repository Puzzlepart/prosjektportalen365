import { SelectionMode } from '@pnp/spfx-controls-react/lib/ListView'
import { HTMLProps } from 'react'

export interface IProjectTableProps<T = any> extends HTMLProps<HTMLDivElement> {
  onSelectionChanged: (selected: T[]) => void
  items: T[]
  fields: IListField[]
  selectionMode: SelectionMode
}

export interface IListField {
  key: string | number
  text: string
  fieldName: string
  onRender?: (item: any, index: number, field: IListField) => JSX.Element
}
