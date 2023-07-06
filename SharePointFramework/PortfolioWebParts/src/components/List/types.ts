import { IScrollablePaneProps, ISearchBoxProps, IShimmeredDetailsListProps } from '@fluentui/react'
import { WebPartContext } from '@microsoft/sp-webpart-base'

export interface IListProps extends IShimmeredDetailsListProps {
  /**
   * Title to display in the list header
   */
  title?: string

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

  /**
   * Layer host id
   */
  layerHostId?: string

  /**
   * Scrollable pane props
   */
  readonly scrollablePane?: IScrollablePaneProps

  /**
   * Search box props
   */
  searchBox?: ISearchBoxProps
}
