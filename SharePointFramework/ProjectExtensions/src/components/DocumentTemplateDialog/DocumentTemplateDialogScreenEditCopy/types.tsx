import { DocumentTemplateDialogScreen } from '..'
import { IDocumentLibrary, TemplateItem } from '../../../models'

export interface IDocumentTemplateDialogScreenEditCopyProps {
  /**
   * Selected templates
   */
  selectedTemplates: TemplateItem[]

  /**
   * Libraries
   */
  libraries: IDocumentLibrary[]

  /**
   * On start copy callback
   *
   * @param {TemplateItem[]} templates Templates
   * @param {string} folderServerRelativeUrl Folder URL
   */
  onStartCopy: (templates: TemplateItem[], folderServerRelativeUrl: string) => void

  /**
   * On change screen
   *
   * @param {DocumentTemplateDialogScreen} screen Screen
   */
  onChangeScreen: (screen: DocumentTemplateDialogScreen) => void
}
