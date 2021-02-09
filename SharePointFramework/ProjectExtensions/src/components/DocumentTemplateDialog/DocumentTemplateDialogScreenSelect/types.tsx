import { IColumn, Selection } from 'office-ui-fabric-react/lib/DetailsList'
import { TemplateItem } from '../../../models'

export interface IDocumentTemplateDialogScreenSelectProps<ItemType = any> {
  /**
   * Templates
   */
  templates: TemplateItem[]

  /**
   * Selection
   */
  selection: Selection

  /**
   * Columns
   */
  columns?: IColumn[]

  /**
   * Selected items
   */
  selectedItems: ItemType[]

  /**
   * Template library
   */
  templateLibrary: { title: string; url: string }
}