import { TypedHash } from '@pnp/common'
import { TemplateItem } from 'models/TemplateItem'

export interface IDocumentTemplateItemProps {
  /**
   * Model
   */
  model: TemplateItem

  /**
   * On input changed
   */
  onInputChanged: (id: string, properties: TypedHash<string>, errorMessage?: string) => void

  /**
   * Folder server relative URL
   */
  folderServerRelativeUrl: string
}

export interface IDocumentTemplateItemState {
  /**
   * Is expanded
   */
  isExpanded: boolean
}
