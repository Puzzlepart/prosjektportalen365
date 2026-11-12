import { PortfolioOverviewView } from 'pp365-shared-library'

/** View-editor visibility and optional existing view to edit. */
export interface IViewFormPanel {
  /**
   * Whether the panel is showing. This is component state, so it keeps its own
   * name rather than tracking the panel's `open` prop.
   */
  isOpen?: boolean
  view?: PortfolioOverviewView
}
