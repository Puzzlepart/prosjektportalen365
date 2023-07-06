import { IScrollablePaneProps, ISearchBoxProps, IShimmeredDetailsListProps } from '@fluentui/react'
import { WebPartContext } from '@microsoft/sp-webpart-base'

export interface IListProps extends Omit<IShimmeredDetailsListProps, 'layoutMode'> {
  /**
   * Title to display in the list header
   */
  title?: string

  /**
   * Set to true to enable add column functionality. This will render a 'new column'-column
   * with commands just like in standard SharePoint lists.
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
   * Scrollable pane props. This is read-only and can't be changed.
   */
  readonly scrollablePane?: IScrollablePaneProps

  /**
   * Search box props
   */
  searchBox?: ISearchBoxProps

  /**
   * Render list in justified layout mode. Manages which columns are visible, tries
   * to size them according to their min/max rules and drops  off columns that can't
   * fit and have isCollapsible set.
   */
  isListLayoutModeJustified?: boolean
}
