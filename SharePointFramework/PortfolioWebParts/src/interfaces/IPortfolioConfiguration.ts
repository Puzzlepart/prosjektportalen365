import { ProjectColumn, PortfolioOverviewView } from 'pp365-shared/lib/models'

export interface IPortfolioConfiguration {
  /**
   * Available columns
   */
  columns: ProjectColumn[]

  /**
   * Available refiners
   */
  refiners: ProjectColumn[]

  /**
   * Available views
   */
  views: PortfolioOverviewView[]

  /**
   * New forms and edit forms urls for views list
   */
  viewsUrls: { defaultNewFormUrl: string; defaultEditFormUrl: string }

  /**
   * New form and edit form urls for columns list
   */
  columnUrls: { defaultNewFormUrl: string; defaultEditFormUrl: string }

  /**
   * Current user can add views (has `ADD_LIST_ITEMS` permission)
   */
  userCanAddViews?: boolean
}
