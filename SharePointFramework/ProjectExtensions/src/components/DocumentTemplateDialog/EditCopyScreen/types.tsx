import { TemplateItem } from '../../../models'

export interface IEditCopyScreenProps {
  /**
   * On start copy callback
   *
   * @param {TemplateItem[]} templates Templates
   */
  onStartCopy: (templates: TemplateItem[]) => void
}
