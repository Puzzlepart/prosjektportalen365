import { IShimmeredDetailsListProps } from '@fluentui/react'
import { WebPartContext } from '@microsoft/sp-webpart-base'

export interface IListProps extends IShimmeredDetailsListProps {
  /**
   * Set to true to enable add column functionality
   */
  isAddColumnEnabled?: boolean

  /**
   * Render a ´ProjectInformationPanel´ component when clicking on the title column
   */
  renderTitleProjectInformationPanel?: boolean

  /**
   * Needed if `renderTitleProjectInformationPanel` is set to `true`
   */
  webPartContext?: WebPartContext
}
