import { TemplateItem } from 'models/TemplateItem'

export interface IDocumentTemplateItemProps {
  /**
   * Item
   */
  item: TemplateItem

  /**
   * On input changed
   */
  onInputChanged: (id: string, properties: Record<string, string>, errorMessage?: string) => void
}

export interface IDocumentTemplateItemState {
  /**
   * Is expanded
   */
  isExpanded: boolean
}
