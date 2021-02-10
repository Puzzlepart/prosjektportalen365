import { AnyAction } from '@reduxjs/toolkit'
import { TemplateItem } from '../../../models'

export interface IEditCopyScreenProps {
  /**
   * Selected templates
   */
  selectedTemplates: TemplateItem[]

  /**
   * On start copy callback
   *
   * @param {TemplateItem[]} templates Templates
   */
  onStartCopy: (templates: TemplateItem[]) => void
  
  /**
   * Target folder
   */
  targetFolder: string

  dispatch: React.Dispatch<AnyAction>
}
