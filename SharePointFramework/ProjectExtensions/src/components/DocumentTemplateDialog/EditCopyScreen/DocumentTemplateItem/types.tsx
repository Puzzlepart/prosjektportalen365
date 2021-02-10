import { TypedHash } from '@pnp/common'
import { TemplateItem } from 'models/TemplateItem'

export interface IDocumentTemplateItemProps {
  /**
   * Item
   */
  item: TemplateItem

  /**
   * On input changed
   */
  onInputChanged: (id: string, properties: TypedHash<string>, errorMessage?: string) => void

  /**
   * Folder URL
   */
  folder: string
}

export interface IDocumentTemplateItemState {
  /**
   * Is expanded
   */
  isExpanded: boolean
}
