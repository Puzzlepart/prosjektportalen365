import { TemplateItem } from '../../../models'

export interface IEditCopyScreenProps {
  /**
   * On start copy callback
   *
   * @param templates Templates
   */
  onStartCopy: (templates: TemplateItem[]) => void
}
