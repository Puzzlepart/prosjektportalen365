import { TypedHash } from '@pnp/common'
import { TemplateFile } from 'models/TemplateFile'

export interface IDocumentTemplateItemProps {
  /**
   * Model
   */
  model: TemplateFile

  /**
   * On input changed
   */
  onInputChanged: (id: string, properties: TypedHash<string>, errorMessage?: string) => void

  /**
   * Folder server relative URL
   */
  folderServerRelativeUrl: string
}
