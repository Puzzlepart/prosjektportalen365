import { TemplateItem } from 'models/TemplateItem'

/** Template copy and callback for validated metadata edits. */
export interface IDocumentTemplateItemProps {
  item: TemplateItem

  onInputChanged: (id: string, properties: Record<string, string>, errorMessage?: string) => void
}
