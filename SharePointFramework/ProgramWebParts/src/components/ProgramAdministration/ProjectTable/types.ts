import { IChildProject } from '../types'
import { IViewField, SelectionMode } from '@pnp/spfx-controls-react/lib/ListView'

export interface IProjectTableProps {
  selectionMode?: SelectionMode
  title?: string
  width?: string
  projects: IChildProject | any
  fields: IViewField[]
  onSelect: (items: any[]) => void
}
