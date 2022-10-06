import { SelectionMode } from '@pnp/spfx-controls-react/lib/ListView'

export interface IProjectTableProps {
  onSelectionChanged: (selected: any[]) => void
  items: any[]
  fields: IListField[]
  selectionMode: SelectionMode
}

export interface IListField {
  key: string | number
  text: string
  fieldName: string
  onRender?: (item: any, index: number, field: IListField) => JSX.Element
}
